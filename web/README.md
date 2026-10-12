# Gelbox web app

The web app and native app are maintained together in this repository. This
folder contains the complete former `sdouglas/gel` project; the application is
in `ts/`, with its documentation in `docs/` and native/web fixtures in `reference/`.

## Develop and verify

```sh
cd web/ts
npm ci                    # Node 22; use nvm use if available
npm run dev               # http://localhost:5173/#/gel
npm run test:unit
npm run test:production    # builds and tests Chromium WebGPU/WebGL2
npm run test:compatibility # builds and tests Firefox/WebKit
```

Install the corresponding Playwright browsers before browser tests:
`npx playwright install chromium firefox webkit` (Linux CI also needs system
libraries; use `--with-deps`). The native app still builds from the repository
root; see the [root README](../README.md).

## Deploy

`npm run build` from `web/ts` produces `web/ts/dist/`. The build uses relative
asset URLs and supports the existing `/gelbox/app/` website path. The public
website remains in the separate `douglaslab.org` repository; copy a verified
build there using the existing release process. Importing this project does
not deploy a new build or alter current download links.

## Maintain parity

Use [the parity ledger](docs/PARITY-LEDGER.md) and [roadmap](docs/ROADMAP.md).
Keep native and web fixes for the same behavior in one change when practical,
and preserve the explicit accepted differences and native-reference provenance.
Historical captures include machine paths and original repository-relative
commands; those describe their recorded environment. Pinned reference rebuilds
still require the original Cinder/native revisions and their prerequisites.

The migration preserves the original web commit IDs as ancestors. For a file's
pre-import history use `git log <web-import-tip> -- ts/path/to/file`, as documented
in [migration provenance](../docs/web-monorepo.md). No submodule or ongoing subtree
sync with the old repository is needed; make future web changes here.
