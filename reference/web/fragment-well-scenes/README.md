# Fragment well compositing baseline

The production `FragmentWell` component at `d62c524` fails all 15 native scenes
on each renderer at DPR 1 and 2: 60 measured comparisons. Maximum channel error
is 108 at DPR 1 and 102 at DPR 2. The empty case also fails, independently of
molecule rendering. `before-*` reports retain each scene's RGB error counts.

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH npm --prefix ts run test:visual -- \
  -c playwright.fragment-well-audit.config.ts --workers=2 \
  --output=/tmp/gel-fragment-well-audit
```

The original audit failed in all four tests. It is now part of the normal
visual suite as `native-fragment-well.spec.ts`. They render the real
`FragmentWell` with a controlled, static molecular snapshot and compare the
entire panel to the independent native capture. Backend acquisition is observed
passively; each test finishes all 15 comparisons before asserting exact parity.

The implementation now replaces the CSS well and separate transparent particle
composition with a shared native-style MSAA surface. All 60 native comparisons
match exact RGB (`after-*` reports). An alpha-only geometric coverage pass keeps
untouched pixels transparent and emits covered pixels opaquely after one native
RGB resolve. This avoids a second browser alpha blend. The native stroke is one physical
pixel; a one-CSS-pixel outline is not equivalent. See the earlier
`../representative-scenes/README.md` for the measured one-channel residual from
a transparent MSAA-only prototype and why that prototype was rejected.

This baseline does not prove full-panel control overlap, clipping, animation,
recovery, or original GUI parity. The integration changes production rendering. A contrasting-background check
proves untouched pixels remain transparent while a subquantum-fade molecule
still covers the known white panel outside the well. Disabling cutout made all
four tests fail that check while native RGB comparisons continued to pass.
