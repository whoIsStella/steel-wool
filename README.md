# Steel Wool

Steel Wool is a defensive privacy and network-safety prototype for reducing accidental data exposure on a workstation.

It combines a small Electron control panel with request-header scrubbing, WireGuard controls, an optional public-IP kill switch, image metadata scrubbing, clipboard checks, and privacy-oriented browser launchers.

> Status: active prototype. Steel Wool is not an audited firewall, anonymity system, or production security boundary.

## Components

- `proxy.py`: mitmproxy addon that removes a small set of identifying or forwarding headers
- `scrubber.py`: rewrites JPEG and PNG files without carrying metadata forward
- `stealth.js`: launches a Chromium session with the Puppeteer stealth plugin
- `tor-stealth.js`: launches Chromium through a local Tor SOCKS proxy
- Electron control panel for local controls and logs
- WireGuard start/stop helpers
- optional public-IP monitoring that can trigger an outbound iptables block

## Architecture

```text
renderer
   |
   v
preload bridge
   |
   v
Electron main process
   |
   +--> browser launchers
   +--> mitmproxy
   +--> image scrubber
   +--> clipboard check
   +--> WireGuard
   +--> optional kill switch
```

The renderer has no Node integration. Privileged operations stay in the Electron main process and are exposed through a small preload IPC bridge.

Child processes are started with argument arrays rather than shell command strings.

## Kill-switch behavior

The kill switch is disabled by default.

To enable it deliberately:

```bash
export STEEL_WOOL_ENABLE_KILL_SWITCH=1
export STEEL_WOOL_EXPECTED_PUBLIC_IP="203.0.113.10"
```

When enabled, Steel Wool checks the current public IP. If it differs from the configured value, the app requests:

```bash
sudo iptables -P OUTPUT DROP
```

If either environment variable is missing, Steel Wool does not change the host firewall policy.

## Run locally

Requirements:

- Node.js 20+
- Python 3.11+
- Chromium
- `mitmproxy` for request scrubbing
- Pillow for image metadata scrubbing
- WireGuard and iptables for the Linux network controls
- Tor for the Tor-routed browser mode
- Xvfb only for headless Electron sessions on Linux

Setup:

```bash
cd scubby
npm install

python3 -m venv .venv
.venv/bin/pip install mitmproxy pillow

npm start
```

For a headless Linux session:

```bash
npm run start:headless
```

Run syntax checks:

```bash
npm run check
python3 -m py_compile proxy.py scrubber.py
```

## Privileged network controls

WireGuard and iptables operations use `sudo`. If the host requires an interactive sudo prompt that Electron cannot satisfy, those operations will fail and log the error. Steel Wool does not try to bypass the host's privilege policy.

## Current limitations

- network controls have not been audited
- the request scrubber uses a small fixed header policy
- image scrubbing currently supports JPEG and PNG only
- browser privacy still depends on Chromium, Puppeteer, Tor configuration, and the surrounding host
- automated verification currently covers syntax and repository hygiene, not end-to-end network behavior

## Repository consolidation

Steel Wool is the canonical repository for this project. `Rubber` was an abandoned bootstrap repository with no implementation beyond repository configuration.

## Scope

Steel Wool is intended for privacy protection, local data-loss prevention, and defensive network controls on systems the operator owns or is authorized to administer.
