# Shared sample / fragment overlap and lifecycle

All 20 native RGB comparisons match exactly: five independent static native scenes
× DPR1/2 × WebGPU/WebGL2. Real SampleSimCanvas and FragmentWell components register
existing engine geometry with the shared app registry and post-commit driver.
Cases include clipped ordinary particles, an unclipped representative, fractional
bounds/origins, and reversed sample/fragment order. The native oracle is
[documented separately](../../native/modern/shared-view-overlap/README.md).

The full SampleView first-open test exposed a missing first-frame contribution:
its passive measurement effect ran after presentation. Both backend tests failed
with only the inspector registered. Measuring in useLayoutEffect fixes this;
opening/removal now observes committed DOM and view keys with unchanged parts,
tick count, local seed and next global random value.

Lifecycle checks preserve the same molecular engine and exact frozen sample
image through four alternating GPU device / GL context losses. Four resizes keep
live graphics resource counts stable; route exit retires them to zero. Injected
buffer allocation failure on both backends reaches a visible error with zero
owned resources, then retry restores drawing without replacing the engine.
Delayed device acquisition after route exit never configures the retired canvas.
Removing the presentation cleanup callbacks deliberately fails both allocation
checks (one tracked texture remains); restoring cleanup passes.

Resource instrumentation counts explicitly destroyable WebGPU buffers/textures
and GL buffers, textures, renderbuffers, framebuffers, VAOs, shaders, programs and
samplers. GPU ownership is identified by its allocation stack in the development
ScenePresentation module; GL ownership uses its canvas. This is not a claim about
driver-resident GPU shader/pipeline memory, which needs release/performance work.

The shared migration remains development-only. These references cover sample
body/shadow/particles and fragment well/representative, not original GUI histories
or all visual paint. Gel, loupes, images, headings, braces, frames and controls
still need migration; crossing those old DOM/canvas boundaries remains wrong.
Production builds continue to ignore the migration switch.

Final regression gates: 2,916 units, 559 browser cases (one intentional duplicate
skipped), four production root/subpath checks and TypeScript/Vite build pass.
The retained reports and source/native manifest hashes are in this directory.
