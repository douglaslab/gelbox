# Native/web repository consolidation

## Goal and layout

Maintain both versions in one repository so a single commit or pull request can
contain corresponding native and web work. Native paths remain at the root;
the complete former web repository is under `web/`, retaining `web/ts/`,
`web/docs/` and `web/reference/`. The website remains a deployment destination
in its own repository.

## History and preservation

- Native starting commit: `7a0bef6` (desktop version 1.1).
- Imported web tip: `9a88c4bd5b7dfd1445b1da1a282d95edd2c75dab`.
- Import method: `git subtree add --prefix=web /Users/shawn/code/gel main`,
  without squash. Both commit histories are ancestors of the import commit.
- The standalone checkout and remote are retained; no history was rewritten,
  repository deleted, or GitHub repository archived.
- Recorded capture artifacts and manifests are imported byte-for-byte. Their
  historical machine paths and commit identifiers remain provenance, not new
  runtime dependencies. Historical web commits still use their original root
  paths, e.g. `git show 812ff8a:ts/src/lib/gel/gelState.ts`.

## Implementation and validation plan

- [x] Import all tracked web files and full commit history under `web/`.
- [x] Activate web CI at `.github/workflows/web.yml` with `web/ts` working,
  Node version and npm-cache paths. Keep the native workflow unchanged.
- [x] Document canonical native/web development paths and beta status.
- [x] Install dependencies from the lockfile; typecheck, build and run unit tests.
- [x] Run compiled production and compatibility browser tests after relocation.
- [x] Verify imported tree against the original and native sources unchanged;
  configure/build native with the existing pinned Cinder checkout.
- [x] Integrate the verified migration into the native repository's mainline.

This is a repository migration, not an application rewrite. Runtime behavior,
reference expectations and deployment URLs are unchanged.

## Verification and native handoff

- `npm ci` from the relocated lockfile: passed.
- `npm run build`: passed (includes TypeScript checking).
- `npm run test:unit`: 79 files, 3,100 tests passed.
- Compiled production browser suite: 128 passed.
- Compiled Firefox/WebKit compatibility suite: 108 passed.
- All 5,164 imported tracked files were compared byte-for-byte to the web tip.
  Only the intentionally relocated/updated CI workflow and `ts/README.md` differ.
  New overview/migration documentation is additional to that original tree.
- Both `7a0bef6` and the original web tip are ancestors of the import commit.
- Native macOS Release configure/build passed with
  `-DCINDER_PATH=/Users/shawn/code/Cinder`. This is a compile/link smoke check,
  not a claim of binary equivalence to the packaged 1.1 release.

Review branch: `integration/web-monorepo`, integrated into `master` after
Shawn confirmed identical native trees and accepted retaining the 1.1 binaries. The complete expected path list
outside `web/` relative to `7a0bef6` is:

```text
.github/workflows/web.yml
README.md
docs/web-monorepo.md
```

Check with:

```sh
git diff --name-status 7a0bef6 HEAD -- . ':!web'
git diff --exit-code 7a0bef6 HEAD -- src include assets proj tools .github/workflows/windows.yml
```

The native source/build tree must remain unchanged. Shawn confirmed the
Mac/Windows 1.1 binaries remain valid because that native tree is identical. Re-cut
the 1.1 source archive from the final merged commit so it includes both apps,
and update the source commit and archive checksum in the release manifest.
Existing native binaries can be retained if that comparison passes. No source
archive, release tag, website deployment or native binary is changed by this
migration branch.
