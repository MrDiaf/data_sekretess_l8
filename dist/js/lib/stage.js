// Reusable canvas helper: HiDPI sizing, world coordinates, drawing primitives,
// pointer events in world coordinates and visibility-aware animation.
/** Read a colour (or any custom property) defined on :root in styles.css. */
export function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
export const C = {
    get blue() { return css("--blue"); },
    get orange() { return css("--orange"); },
    get aqua() { return css("--aqua"); },
    get yellow() { return css("--yellow"); },
    get red() { return css("--red"); },
    get text() { return css("--text"); },
    get muted() { return css("--muted"); },
    get grid() { return css("--grid"); },
    get axis() { return css("--axis"); },
    get panel() { return css("--panel"); },
};
const SANS = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
export class Stage {
    canvas;
    ctx;
    w = 0;
    h = 0;
    pad = { l: 44, r: 12, t: 12, b: 34 };
    x0 = 0;
    x1 = 1;
    y0 = 0;
    y1 = 1;
    equal = false;
    sx = 1;
    sy = 1;
    ox = 0;
    oy = 0;
    draw = () => { };
    anim = null;
    raf = 0;
    visible = false;
    last = 0;
    dead = false;
    constructor(host, opts = {}) {
        this.canvas = document.createElement("canvas");
        this.canvas.className = "stage";
        if (opts.label) {
            this.canvas.setAttribute("role", "img");
            this.canvas.setAttribute("aria-label", opts.label);
        }
        if (opts.draggable)
            this.canvas.style.touchAction = "none";
        host.append(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        const height = opts.height;
        const aspect = opts.aspect ?? 0.6;
        const resize = () => {
            if (!this.canvas.isConnected)
                return;
            const w = this.canvas.parentElement.clientWidth;
            const h = height ?? Math.round(Math.min(Math.max(w * aspect, 220), 520));
            if (w === this.w && h === this.h)
                return;
            const dpr = window.devicePixelRatio || 1;
            this.w = w;
            this.h = h;
            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;
            this.canvas.width = Math.round(w * dpr);
            this.canvas.height = Math.round(h * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.updateView();
            this.redraw();
        };
        // Resize on the next frame: resizing inside the observer callback causes
        // "ResizeObserver loop completed with undelivered notifications".
        const ro = new ResizeObserver(() => requestAnimationFrame(() => {
            if (!this.canvas.isConnected) {
                ro.disconnect();
                io.disconnect();
                this.dead = true;
                this.stopLoop();
                return;
            }
            resize();
        }));
        const io = new IntersectionObserver((entries) => {
            this.visible = entries.some((e) => e.isIntersecting);
            if (this.visible)
                this.startLoop();
            else
                this.stopLoop();
        });
        requestAnimationFrame(() => { ro.observe(this.canvas.parentElement); io.observe(this.canvas); resize(); });
    }
    /** World window. With equalAspect, one world unit is the same number of pixels on both axes. */
    setView(x0, x1, y0, y1, equalAspect = false) {
        this.x0 = x0;
        this.x1 = x1;
        this.y0 = y0;
        this.y1 = y1;
        this.equal = equalAspect;
        this.updateView();
    }
    updateView() {
        const { l, r, t, b } = this.pad;
        const pw = Math.max(1, this.w - l - r);
        const ph = Math.max(1, this.h - t - b);
        this.sx = pw / (this.x1 - this.x0);
        this.sy = ph / (this.y1 - this.y0);
        this.ox = l;
        this.oy = t;
        if (this.equal) {
            const s = Math.min(this.sx, this.sy);
            this.ox = l + (pw - s * (this.x1 - this.x0)) / 2;
            this.oy = t + (ph - s * (this.y1 - this.y0)) / 2;
            this.sx = this.sy = s;
        }
    }
    X(x) { return this.ox + (x - this.x0) * this.sx; }
    Y(y) { return this.oy + (this.y1 - y) * this.sy; }
    invX(px) { return this.x0 + (px - this.ox) / this.sx; }
    invY(py) { return this.y1 - (py - this.oy) / this.sy; }
    /** World distance corresponding to n pixels horizontally. */
    px(n) { return n / this.sx; }
    redraw() {
        if (this.w === 0 || this.dead)
            return;
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.draw();
    }
    axes(o = {}) {
        const c = this.ctx;
        const xf = o.xFmt ?? ((v) => String(v));
        const yf = o.yFmt ?? ((v) => String(v));
        c.save();
        c.lineWidth = 1;
        c.font = `11px ${SANS}`;
        c.fillStyle = C.muted;
        if (o.grid !== false) {
            c.strokeStyle = C.grid;
            c.beginPath();
            for (const y of o.yTicks ?? []) {
                c.moveTo(this.X(this.x0), Math.round(this.Y(y)) + 0.5);
                c.lineTo(this.X(this.x1), Math.round(this.Y(y)) + 0.5);
            }
            c.stroke();
        }
        c.strokeStyle = C.axis;
        c.beginPath();
        c.moveTo(this.X(this.x0), Math.round(this.Y(this.y0)) + 0.5);
        c.lineTo(this.X(this.x1), Math.round(this.Y(this.y0)) + 0.5);
        c.stroke();
        c.textAlign = "center";
        c.textBaseline = "top";
        for (const x of o.xTicks ?? [])
            c.fillText(xf(x), this.X(x), this.Y(this.y0) + 6);
        c.textAlign = "right";
        c.textBaseline = "middle";
        // a tick label in the top 18px would collide with the y-axis title drawn there
        for (const y of o.yTicks ?? [])
            if (!(o.yLabel && this.Y(y) < 18))
                c.fillText(yf(y), this.X(this.x0) - 6, this.Y(y));
        c.fillStyle = C.text;
        c.font = `12px ${SANS}`;
        if (o.xLabel) {
            c.textAlign = "center";
            c.textBaseline = "bottom";
            c.fillText(o.xLabel, (this.X(this.x0) + this.X(this.x1)) / 2, this.h - 2);
        }
        if (o.yLabel) {
            c.textAlign = "left";
            c.textBaseline = "top";
            c.fillText(o.yLabel, 4, 0);
        }
        c.restore();
    }
    /** Run `fn` with drawing clipped to the plot area, so lines cannot spill over the axes. */
    clipped(fn) {
        const c = this.ctx;
        c.save();
        c.beginPath();
        c.rect(this.X(this.x0), this.Y(this.y1), this.X(this.x1) - this.X(this.x0), this.Y(this.y0) - this.Y(this.y1));
        c.clip();
        fn();
        c.restore();
    }
    dot(x, y, r, fill, ring) {
        const c = this.ctx;
        c.beginPath();
        c.arc(this.X(x), this.Y(y), r, 0, Math.PI * 2);
        c.fillStyle = fill;
        c.fill();
        if (ring) {
            c.lineWidth = 2;
            c.strokeStyle = ring;
            c.stroke();
        }
    }
    ring(x, y, r, color, width = 2) {
        const c = this.ctx;
        c.beginPath();
        c.arc(this.X(x), this.Y(y), r, 0, Math.PI * 2);
        c.lineWidth = width;
        c.strokeStyle = color;
        c.stroke();
    }
    /** Square marker, used as a second shape so series never rely on colour alone. */
    square(x, y, r, fill) {
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(this.X(x) - r, this.Y(y) - r, 2 * r, 2 * r);
    }
    line(pts, color, width = 2, dash = []) {
        if (pts.length < 2)
            return;
        const c = this.ctx;
        c.save();
        c.beginPath();
        c.setLineDash(dash);
        c.lineJoin = "round";
        c.moveTo(this.X(pts[0][0]), this.Y(pts[0][1]));
        for (const p of pts.slice(1))
            c.lineTo(this.X(p[0]), this.Y(p[1]));
        c.lineWidth = width;
        c.strokeStyle = color;
        c.stroke();
        c.restore();
    }
    area(pts, fill) {
        if (pts.length < 3)
            return;
        const c = this.ctx;
        c.beginPath();
        c.moveTo(this.X(pts[0][0]), this.Y(pts[0][1]));
        for (const p of pts.slice(1))
            c.lineTo(this.X(p[0]), this.Y(p[1]));
        c.closePath();
        c.fillStyle = fill;
        c.fill();
    }
    /** Vertical bar from y=base to y, with a rounded data end and a 1px gap on each side. */
    bar(x0, x1, y, color, base = 0) {
        const c = this.ctx;
        const l = this.X(x0) + 1;
        const r = this.X(x1) - 1;
        const top = this.Y(Math.max(y, base));
        const bot = this.Y(Math.min(y, base));
        const w = Math.max(1, r - l);
        const hgt = bot - top;
        if (hgt <= 0)
            return;
        const rad = Math.min(4, w / 2, hgt);
        c.beginPath();
        c.roundRect(l, top, w, hgt, y >= base ? [rad, rad, 0, 0] : [0, 0, rad, rad]);
        c.fillStyle = color;
        c.fill();
    }
    /** Text at world coordinates. Text uses ink colours, not series colours, unless told otherwise. */
    text(s, x, y, o = {}) {
        const c = this.ctx;
        c.save();
        c.font = `${o.bold ? "600 " : ""}${o.size ?? 12}px ${SANS}`;
        c.fillStyle = o.color ?? C.text;
        c.textAlign = o.align ?? "left";
        c.textBaseline = o.base ?? "middle";
        c.fillText(s, this.X(x) + (o.dx ?? 0), this.Y(y) + (o.dy ?? 0));
        c.restore();
    }
    /** Pointer events in world coordinates. */
    onPointer(handler) {
        const at = (ev) => {
            const r = this.canvas.getBoundingClientRect();
            return [this.invX(ev.clientX - r.left), this.invY(ev.clientY - r.top)];
        };
        this.canvas.addEventListener("pointerdown", (ev) => { this.canvas.setPointerCapture(ev.pointerId); handler("down", ...at(ev), ev); });
        this.canvas.addEventListener("pointermove", (ev) => handler("move", ...at(ev), ev));
        this.canvas.addEventListener("pointerup", (ev) => handler("up", ...at(ev), ev));
        this.canvas.addEventListener("pointerleave", (ev) => handler("leave", ...at(ev), ev));
    }
    /** Animate while the canvas is visible. `step` returns false to stop. */
    play(step) {
        this.anim = step;
        this.startLoop();
    }
    pause() {
        this.anim = null;
        this.stopLoop();
    }
    get playing() { return this.anim !== null; }
    startLoop() {
        if (!this.anim || !this.visible || this.raf || this.dead)
            return;
        this.last = performance.now();
        const tick = (t) => {
            this.raf = 0;
            if (!this.anim || this.dead)
                return;
            if (!this.canvas.isConnected) {
                this.dead = true;
                return;
            }
            const dt = Math.min(0.1, (t - this.last) / 1000);
            this.last = t;
            if (this.anim(dt) === false) {
                this.anim = null;
                this.redraw();
                return;
            }
            this.redraw();
            if (this.visible)
                this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
    }
    stopLoop() {
        if (this.raf)
            cancelAnimationFrame(this.raf);
        this.raf = 0;
    }
}
/** Evenly spaced ticks from a to b (inclusive) with the given step. */
export function ticks(a, b, step) {
    const out = [];
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step)
        out.push(Number(v.toFixed(10)));
    return out;
}
