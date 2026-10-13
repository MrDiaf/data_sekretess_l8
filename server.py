#!/usr/bin/env python3
"""Static server for the learning site. Standard library only.

Usage:
  python server.py [run]       serve dist/ in the foreground
  python server.py start       start in the background (writes .run/server.json)
  python server.py stop        turn this site's Tailscale Funnel off, then stop the background server
  python server.py status      show whether it is running and where
  python server.py funnel-on   publish the running site on the internet via Tailscale Funnel
  python server.py funnel-off  stop publishing it (the site keeps running)

Options: --port N (or $PORT) to require a specific port; otherwise a free one
is found starting at 8000. $FUNNEL_HTTPS picks the public Funnel port (443, 8443
or 10000); otherwise the first free one is used.
"""
import argparse
import http.server
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
RUN_DIR = ROOT / ".run"
STATE = RUN_DIR / "server.json"
LOG = RUN_DIR / "server.log"
MARKER = "X-Lesson-Server"
MARKER_NAME = "privacy-computations"
PREFERRED_PORT = 8000
PORT_TRIES = 100
FUNNEL_PORTS = (443, 8443, 10000)  # the only public ports Tailscale Funnel allows


class Handler(http.server.SimpleHTTPRequestHandler):
    # Explicit types: some Windows registries map .js to text/plain, which breaks module scripts.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".svg": "image/svg+xml",
        ".json": "application/json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def end_headers(self):
        self.send_header(MARKER, f"{MARKER_NAME}; pid={os.getpid()}")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


# On POSIX, SO_REUSEADDR only lets us reuse a port stuck in TIME_WAIT (e.g. right after
# `make down`); an active listener still blocks the bind. On Windows it would allow two
# servers on one port, so it stays off there.
REUSE = os.name != "nt"


class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = REUSE
    daemon_threads = True


def port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if REUSE:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("0.0.0.0", port))
            return True
        except OSError:
            return False


def pick_port(requested):
    if requested is not None:
        if not port_free(requested):
            sys.exit(f"Port {requested} is already in use. Pick another one, or leave PORT unset "
                     f"to choose a free port automatically.")
        return requested
    for port in range(PREFERRED_PORT, PREFERRED_PORT + PORT_TRIES):
        if port_free(port):
            return port
    sys.exit(f"No free port found in {PREFERRED_PORT}-{PREFERRED_PORT + PORT_TRIES - 1}. "
             f"Set one explicitly with --port / PORT=.")


def lan_addresses():
    addrs = []
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))  # no packet is sent; this only picks a route
            addrs.append(s.getsockname()[0])
    except OSError:
        pass
    return [a for a in addrs if not a.startswith("127.")]


def print_urls(port):
    print(f"  Local:   http://localhost:{port}")
    for a in lan_addresses():
        print(f"  Network: http://{a}:{port}")


def probe(port):
    """Return the pid our server reports on this port, or None if it is not our server."""
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1.5) as r:
            value = r.headers.get(MARKER, "")
    except Exception:
        return None
    if not value.startswith(MARKER_NAME):
        return None
    for part in value.split(";"):
        part = part.strip()
        if part.startswith("pid="):
            try:
                return int(part[4:])
            except ValueError:
                return None
    return None


def read_state():
    try:
        return json.loads(STATE.read_text())
    except (OSError, ValueError):
        return None


def running():
    """(pid, port) of our live background server, or None."""
    st = read_state()
    if not st:
        return None
    pid = probe(st.get("port", 0))
    if pid is None or pid != st.get("pid"):
        return None
    return st["pid"], st["port"]


def require_dist():
    if not (DIST / "index.html").is_file():
        sys.exit("dist/index.html is missing. Build the site first with `make build` "
                 "(needs Node.js), or use a copy of the project that includes dist/.")


# ---- Tailscale Funnel ----

FUNNEL_HINTS = (
    ("access denied", "Allow your user to manage Tailscale without sudo (once, yourself):\n"
                      "  sudo tailscale set --operator=$USER"),
    ("login.tailscale.com", "Open the link above to enable Funnel (and HTTPS) for your tailnet, then run "
                            "`make funnel-on` again."),
    ("logged out", "Tailscale is logged out. Run `tailscale up`, then retry."),
    ("needslogin", "Tailscale is logged out. Run `tailscale up`, then retry."),
    ("failed to connect", "The Tailscale service is not running. Start it (or run `tailscale up`), then retry."),
    ("is tailscale running", "The Tailscale service is not running. Start it (or run `tailscale up`), then retry."),
)


def funnel_hint(output):
    low = output.lower()
    return "\n".join(dict.fromkeys(h for key, h in FUNNEL_HINTS if key in low))


def tailscale_json(*args):
    """Run `tailscale <args> --json`. Returns (parsed JSON, None) or (None, error text)."""
    try:
        r = subprocess.run(["tailscale", *args, "--json"], capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.TimeoutExpired) as e:
        return None, str(e)
    if r.returncode != 0:
        return None, (r.stderr or r.stdout).strip()
    try:
        return json.loads(r.stdout or "{}"), None
    except ValueError:
        return None, r.stdout.strip()


def funnel_mappings():
    """({public port: (host, proxy target)} for everything Tailscale serves here, None) or (None, error)."""
    data, err = tailscale_json("funnel", "status")
    if data is None:
        return None, err
    out = {}
    for hostport, cfg in (data.get("Web") or {}).items():
        host, _, port = hostport.rpartition(":")
        handlers = cfg.get("Handlers") or {}
        proxy = (handlers.get("/") or {}).get("Proxy") or f"other handlers: {', '.join(handlers) or 'none'}"
        out[int(port)] = (host, proxy)
    for port in (data.get("TCP") or {}):
        out.setdefault(int(port), ("", "a TCP forwarder"))  # a port can be taken without a web handler
    return out, None


def self_host():
    data, _ = tailscale_json("status")
    return ((data or {}).get("Self") or {}).get("DNSName", "").rstrip(".") or "<machine>.<tailnet>.ts.net"


def funnel_url(host, port):
    return f"https://{host}/" if port == 443 else f"https://{host}:{port}/"


def funnel_off(port):
    """Remove every Funnel mapping that points at this site (local port `port`), and nothing else.
    Returns (ok, message)."""
    if not shutil.which("tailscale") or port is None:
        return True, "Funnel is off."
    maps, err = funnel_mappings()
    if maps is None:
        return False, f"Could not read the Funnel status from Tailscale, so nothing was changed:\n  {err}"
    target = f"http://127.0.0.1:{port}"
    mine = sorted(p for p, (_, proxy) in maps.items() if proxy == target)
    for p in mine:
        r = subprocess.run(["tailscale", "funnel", f"--https={p}", "off"], capture_output=True, text=True, timeout=20)
        if r.returncode != 0:
            out = (r.stderr or r.stdout).strip()
            hint = funnel_hint(out)
            return False, f"Could not turn Funnel off on public port {p}:\n  {out}" + (f"\n{hint}" if hint else "")
    if mine:
        return True, f"Funnel is off (no longer published on public port {', '.join(map(str, mine))})."
    return True, "Funnel is off."


def cmd_funnel_on():
    if not shutil.which("tailscale"):
        sys.exit("The tailscale CLI was not found. Install Tailscale (https://tailscale.com/download), "
                 "log in, and retry.")
    cur = running()
    if not cur:
        sys.exit("The site is not running. Start it with `make up` first.")
    target = f"http://127.0.0.1:{cur[1]}"
    maps, err = funnel_mappings()
    if maps is None:
        hint = funnel_hint(err)
        sys.exit(f"Could not read the Funnel status from Tailscale:\n  {err}" + (f"\n{hint}" if hint else ""))
    for p, (host, proxy) in sorted(maps.items()):
        if proxy == target:
            print("Funnel is already on. Anyone with this address can open the site:")
            print(f"  Public:  {funnel_url(host or self_host(), p)}")
            return

    wanted = os.environ.get("FUNNEL_HTTPS", "").strip()
    if wanted:
        if not wanted.isdigit() or int(wanted) not in FUNNEL_PORTS:
            sys.exit(f"FUNNEL_HTTPS must be 443, 8443 or 10000 (the only ports Funnel allows), got {wanted!r}.")
        public = int(wanted)
        if public in maps:
            sys.exit(f"Public port {public} is already used by another Funnel/Serve mapping "
                     f"({maps[public][1]}). It is left alone. Pick another FUNNEL_HTTPS, "
                     f"or leave it unset to use a free port.")
    else:
        free = [p for p in FUNNEL_PORTS if p not in maps]
        if not free:
            used = ", ".join(f"{p} → {maps[p][1]}" for p in FUNNEL_PORTS)
            sys.exit(f"All Funnel ports are used by other mappings ({used}). They are left alone. "
                     f"Free one with `tailscale funnel --https=<port> off` if you no longer need it.")
        public = free[0]

    # Stream Tailscale's output live: on first use it prints an approval link and waits.
    proc = subprocess.Popen(["tailscale", "funnel", "--bg", "--yes", f"--https={public}", target],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    lines = []
    for line in proc.stdout:
        lines.append(line)
        print("  " + line.rstrip())
    if proc.wait() != 0:
        hint = funnel_hint("".join(lines))
        sys.exit("Tailscale could not turn Funnel on." + (f"\n{hint}" if hint else ""))
    host = next((h for p, (h, proxy) in (funnel_mappings()[0] or {}).items() if proxy == target and h), "")
    print("Funnel is on. Anyone with this address can open the site:")
    print(f"  Public:  {funnel_url(host or self_host(), public)}")
    print("Run `make funnel-off` to stop publishing (`make down` does it too).")


def cmd_funnel_off():
    st = read_state() or {}
    ok, msg = funnel_off(st.get("port"))
    if not ok:
        sys.exit(msg)
    print(msg)


# ---- lifecycle ----

def cmd_run(port_arg, quiet=False):
    require_dist()
    port = pick_port(port_arg)
    httpd = Server(("0.0.0.0", port), Handler)
    if not quiet:
        print("Serving the learning site:")
        print_urls(port)
        print("Press Ctrl+C to stop.")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


def cmd_start(port_arg):
    require_dist()
    cur = running()
    if cur:
        print(f"Already running (pid {cur[0]}).")
        print_urls(cur[1])
        return
    port = pick_port(port_arg)
    RUN_DIR.mkdir(exist_ok=True)
    log = open(LOG, "ab")
    kwargs = {}
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    child = subprocess.Popen(
        [sys.executable, str(ROOT / "server.py"), "run", "--port", str(port), "--quiet"],
        stdout=log, stderr=log, stdin=subprocess.DEVNULL, cwd=str(ROOT), **kwargs)
    deadline = time.time() + 10
    while time.time() < deadline:
        if probe(port) == child.pid:
            break
        if child.poll() is not None:
            sys.exit(f"The server exited immediately. See {LOG.relative_to(ROOT)}.")
        time.sleep(0.15)
    else:
        child.terminate()
        sys.exit(f"The server did not answer within 10 s. See {LOG.relative_to(ROOT)}.")
    STATE.write_text(json.dumps({"pid": child.pid, "port": port}))
    print("Learning site started:")
    print_urls(port)
    print("Run `make status` to see the address again, `make down` to stop.")


def cmd_stop():
    # Unpublish first, while the saved port is still known: a public address must never
    # outlive the site and point at a port another program may take next.
    st = read_state() or {}
    ok, msg = funnel_off(st.get("port"))
    if not ok or msg != "Funnel is off.":
        print(msg if ok else f"Warning: {msg}")
    cur = running()
    if not cur:
        print("Not running.")
        STATE.unlink(missing_ok=True)
        return
    pid, port = cur
    try:
        os.kill(pid, signal.SIGTERM)
    except OSError as e:
        sys.exit(f"Could not stop pid {pid}: {e}")
    deadline = time.time() + 5
    while time.time() < deadline and probe(port) is not None:
        time.sleep(0.1)
    STATE.unlink(missing_ok=True)
    print(f"Stopped (pid {pid}, port {port}).")


def cmd_status():
    cur = running()
    if not cur:
        print("Not running. Start it with `make up`.")
        return
    print(f"Running (pid {cur[0]}):")
    print_urls(cur[1])


def main():
    ap = argparse.ArgumentParser(description="Serve the learning site.")
    ap.add_argument("command", nargs="?", default="run",
                    choices=["run", "start", "stop", "status", "funnel-on", "funnel-off"])
    ap.add_argument("--port", type=int, default=None)
    ap.add_argument("--quiet", action="store_true", help=argparse.SUPPRESS)
    a = ap.parse_args()
    port = a.port
    if port is None and os.environ.get("PORT"):
        try:
            port = int(os.environ["PORT"])
        except ValueError:
            sys.exit(f"PORT must be a number, got {os.environ['PORT']!r}.")
    {
        "run": lambda: cmd_run(port, a.quiet),
        "start": lambda: cmd_start(port),
        "stop": cmd_stop,
        "status": cmd_status,
        "funnel-on": cmd_funnel_on,
        "funnel-off": cmd_funnel_off,
    }[a.command]()


if __name__ == "__main__":
    main()
