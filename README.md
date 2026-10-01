# Steel Wool

A defensive privacy and network-safety prototype for a workstation: a small Electron panel for request scrubbing, image metadata removal, WireGuard controls, and separate Chromium launches. The useful part is the boundary between a button in the renderer and a privileged host operation.

**Prototype, not an audited firewall or anonymity system.** Automated checks cover syntax, not end-to-end network protection.

## What is implemented

- A sandboxed Electron renderer with no Node integration; a narrow preload IPC bridge calls the main process.
- Child processes launched with argument arrays, not shell strings.
- A mitmproxy addon that removes four request headers. Traffic must actually be routed through the proxy.
- JPEG/PNG rewrites through Pillow; this is not proof that every identifying field is removed.
- WireGuard start/stop controls, a simple clipboard check, and Chromium launchers with an optional local Tor SOCKS proxy.
- An opt-in public-IP check that can change Linux's outbound firewall policy.

The panel's renderer sandbox and the launched browser are separate boundaries.
**The current Puppeteer launchers disable Chromium's sandbox.** A temporary
browser session does not make browsing anonymous or safely isolated.

## Run locally

Requires Node.js 20+, Python 3.11+, and a graphical desktop. WireGuard and
iptables controls are Linux-specific; Tor mode needs a running local Tor proxy.

```bash
cd scubby
npm install
python3 -m venv .venv
.venv/bin/pip install mitmproxy pillow
export STEEL_WOOL_PYTHON="$PWD/.venv/bin/python"
export PATH="$PWD/.venv/bin:$PATH"
npm start
```

The Python interpreter and PATH settings let the Electron subprocesses find the
dependencies installed in that virtual environment.

```bash
npm run check
.venv/bin/python -m py_compile proxy.py scrubber.py
```

`npm run start:headless` needs Xvfb and disables Electron's sandbox too.
It is a headless development shortcut, not the recommended security posture.

## Privileged controls

WireGuard and iptables use `sudo`; operations fail and log an error if the host
needs an interactive prompt that Electron cannot provide.

The kill switch is **off by default**. Enabling it requires both:

```bash
export STEEL_WOOL_ENABLE_KILL_SWITCH=1
export STEEL_WOOL_EXPECTED_PUBLIC_IP="203.0.113.10" # replace with the expected IP
```

A different observed IP requests `sudo iptables -P OUTPUT DROP`. The app does
not automatically restore that policy. Failed IP lookups only log an error;
they do not block traffic. This is polling, not fail-closed leak prevention.

## Read the implementation

[main.js](scubby/main.js) owns host operations;
[preload.js](scubby/preload.js) defines the renderer's interface.
[proxy.py](scubby/proxy.py) and [scrubber.py](scubby/scrubber.py) contain the
small scrubbing policies. Browser launchers are
[stealth.js](scubby/stealth.js) and [tor-stealth.js](scubby/tor-stealth.js).

No network audit, DNS/leak test suite, cross-platform acceptance, or comprehensive
metadata-removal guarantee is established. Intended for defensive use on
machines the operator is authorized to administer.
