# Apply the Steel Wool rehab

These files are prepared against `whoIsStella/steel-wool` as inspected on September 21, 2026.

From a clean clone of the repository root, copy the replacement files over the existing paths, then remove two obsolete files:

```bash
rm -f scubby/build.yml
rm -f github/dependabot.yml
```

The real `.github/dependabot.yml` should remain in place.

Recommended commit split:

```text
docs: rehabilitate Steel Wool project overview
fix: make desktop prototype safe by default
ci: consolidate Rubber security scanning into Steel Wool
chore: remove obsolete workflow scaffolding
```

After applying, run:

```bash
cd scubby
node --check main.js
node --check renderer.js
node --check stealth.js
node --check tor-stealth.js
python3 -m py_compile proxy.py scrubber.py
```

Then push a branch and open a PR rather than committing directly to `main`.

Once the Steel Wool PR is merged, `Rubber` can be archived or made private. Its current implementation contains no project code beyond README/configuration and the incomplete CodeQL workflow that this rehab replaces with `.github/workflows/codeql.yml`.
