# Learning site for "Privacy for computations" (differential privacy, secure multiparty computation).
# Run `make help` for the commands.

PY := $(shell command -v python3 2>/dev/null || command -v python 2>/dev/null)

.PHONY: help up down status logs build test funnel-on funnel-off need-python

help:
	@echo "Available commands:"
	@echo ""
	@echo "  make up          Start the site in the background (builds dist/ first if missing)"
	@echo "  make down        Stop the site (and turn its Tailscale Funnel off)"
	@echo "  make status      Show whether the site runs and its URLs"
	@echo "  make logs        Follow the server log"
	@echo "  make build       Rebuild dist/ from src/ and public/ (needs Node.js)"
	@echo "  make test        Build, then run the unit tests"
	@echo "  make funnel-on   Start the site if needed and publish it on the internet via Tailscale Funnel"
	@echo "  make funnel-off  Stop publishing via Tailscale Funnel (the site keeps running)"
	@echo "  make help        Show this help"
	@echo ""
	@echo "Options: PORT=8123 make up                (use a fixed local port instead of picking a free one)"
	@echo "         FUNNEL_HTTPS=8443 make funnel-on  (public Funnel port: 443, 8443 or 10000; default: first free)"

need-python:
	@[ -n "$(PY)" ] || { echo "Python 3 is required. Install it and retry."; exit 1; }

up: need-python
	@if [ ! -f dist/index.html ]; then \
		if command -v npm >/dev/null 2>&1; then $(MAKE) --no-print-directory build; \
		else echo "dist/ is missing and npm is not installed. Install Node.js and run 'make build', or use a copy that includes dist/."; exit 1; fi; \
	fi
	@$(PY) server.py start $(if $(PORT),--port $(PORT))
	@echo "Run 'make help' for more commands."

down: need-python
	@$(PY) server.py stop

status: need-python
	@$(PY) server.py status

logs:
	@[ -f .run/server.log ] || { echo "No log yet. Start the site with 'make up'."; exit 1; }
	tail -f .run/server.log

build:
	@command -v npm >/dev/null 2>&1 || { echo "Node.js (npm) is required to build. Install it and retry."; exit 1; }
	npm ci
	rm -rf dist
	mkdir -p dist
	cp -R public/. dist/
	./node_modules/.bin/tsc

test: build
	node --test tests/*.test.mjs

funnel-on: up
	@$(PY) server.py funnel-on

funnel-off: need-python
	@$(PY) server.py funnel-off
