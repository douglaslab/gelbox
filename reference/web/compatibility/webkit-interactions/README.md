# WebKit core interaction evidence

On 2026-10-10, isolated Playwright 1.64.0 / WebKit 27.2 revision 2370 passed
**21 existing interaction cases**, with WebGL2 and DPR 2. The five source test
files are hashed in `manifest.json`; the temporary runner used byte-identical
copies. This extends the separate built-app root/subpath checks to development
server interaction workflows, not shipping Safari certification.

Coverage includes sample move/clone/outside re-entry/capture loss, keyboard
editing while dragging a tube, species creation and editing, native composed
multimer movement, representative molecule color rendering, palette press and
drag, inspector details, persistent loupe creation/body/anchor/wedge movement,
resize, stacking, keyboard deletion and capture cancellation.

One case ending in a full-page Chromium screenshot golden is explicitly excluded:
`loupe particles remain paused without the screenshot freeze hook`. There is no
reviewed WebKit baseline. An exploratory run generated a temporary missing
snapshot; it was not accepted as evidence. The retained final configuration uses
`updateSnapshots: 'none'` and excludes that case. No repository goldens changed.

## Diagnosed test assumptions

The strict loupe placement test initially requested (235.85713958740234,
187.2919921875), but WebKit delivered (235, 187). The frame was correctly placed
at (320.5, 101.5). The shared test now supplies integer mouse coordinates so all
engines receive the same input; geometry tolerances are unchanged.

A subsequent exact element-screenshot comparison differed in 357 pixels, all in
the outer composited focus border. Both screenshots are retained. They are
344 × 344 despite a 171 × 171 CSS element at DPR 2, because element capture rounds
fractional clip bounds. The 340 × 340 interior is byte-identical after decoding
RGB. The border is translucent and moving it changes the background beneath it.
The molecule-invariance assertion now compares an integer-aligned interior clip,
still with exact equality; it no longer makes a claim about the surrounding CSS
frame. The separate full-page visual check remains unchanged in Chromium.

These are test portability corrections. Product code did not change. The
initial fixture-path failures from invoking the temporary runner outside `ts`
were invocation errors; the final retained run uses the correct working directory.

## Reproduction

Use the isolated runner installation described in `../playwright-1.64/README.md`.
Copy the five manifest-listed tests from `ts/tests/visual` into its `interactions`
subdirectory, use the retained configuration (adjust absolute temporary output
paths and webServer cwd), and run its CLI **with the repository `ts` directory as
working directory**. The config starts a separate Vite server on port 5178 and
uses four workers with no retries. Preserve the exclusion and snapshot policy.

Firefox launch, shipping Safari, full native raster comparisons, lifecycle and
performance remain separate open gates.
