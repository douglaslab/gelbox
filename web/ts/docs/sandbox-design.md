# Simulation sandbox design notes

A retrospective on a worked-example placement-sandbox suite (DNA origami
placement), situated in the broader lineage of Gelbox / Earth Primer /
explorable explanations, and a working set of design rules for the next
sandboxes built in this style.

The dashboard-layer companion to this doc is
[`principles.md`](principles.md); the engine-layer companion is
[`sandbox-engine.md`](sandbox-engine.md). Sandboxes nest inside pages;
pages nest inside the dashboard.

Audience: anyone designing a sandbox in this lineage. Not a spec — a playbook.

---

## 1. The lineage

The placement sandboxes referenced below are not a new genre. They sit
inside a ten-year arc of "explorable explanation" tools, and three reference
points dominate the lineage we're working in:

- **Earth Primer** (Chaim Gingold, 2015) — iPad app that taught geophysics
  through painterly, gesture-driven simulation. Five chapters: Interior,
  Surface, Water Cycle, Biomes, Sandbox. Famous for warmth, restraint, and
  a "book that animates as you read it" structure.
- **Gelbox** (Douglas Lab + Chaim Gingold, 2018) — macOS desktop app for
  gel electrophoresis, written in C++/libcinder/OpenGL. Direct manipulation
  of samples and bands; time-scrubbing; loupes that drill into a
  molecular-scale particle view. Released as the artifact of a multi-year
  design collaboration.
- **"Sandboxes to Think and Play With"** — Chaim Gingold and Shawn Douglas,
  [InterPlanetary Festival 2018](https://www.youtube.com/watch?v=_poJx7XrABY),
  Santa Fe Institute, 30 min. CADnano, Spore, Earth Primer, and Gelbox are
  all instances of the same move. Two load-bearing claims:

  > "Simulations… they're almost like telescopes. They make invisible
  > phenomena visible so that we can first of all see them and then we can
  > touch them." — Gingold

  > "This is a way of scaffolding learning… to streamline some of the pain
  > and suffering that students spend a lot of time with these gels and
  > kind of quickly bootstrap a working mental model… condense maybe the
  > six months or two years' worth of painful experience." — Douglas

  Frame each sim the same way: a telescope onto one piece of physics that's
  normally hours or weeks of wet-lab time, and the surrounding page is
  scaffolding for the mental model a reviewer will need to evaluate the
  design.

- **Chaim Gingold, *Building SimCity: How to Put the World in a Machine***
  (MIT Press, 2024). The deepest published study of what makes a simulation
  toy work. Gingold (Earth Primer's author, Gelbox's collaborator) reads
  SimCity through its source code, its design history, and a play-theory
  lens — and reads it as a living *analogy machine*, not a model: a
  synthesis of system dynamics, cellular automata, and videogame idioms.
  Belongs on the same shelf as Earth Primer and Gelbox; §4 below pulls the
  lessons most directly applicable to sandboxes built in this lineage.

Adjacent reference points worth keeping on the shelf: Nicky Case's
explorables (`ncase.me`), Bartosz Ciechanowski's longform interactives
(`ciechanow.ski`), Bret Victor's *Inventing on Principle* and *Up and Down
the Ladder of Abstraction*, distill.pub's research interactives. Earth
Primer remains the gold standard for *aesthetic* warmth; Gelbox remains the
gold standard with direct authorial access; *Building SimCity* is the gold
standard for the post-mortem.

---

## 2. Worked example: a DNA-origami placement page

The worked example throughout this doc is a `/placement` page that groups
six sandboxes into three sections, each opening with a one-sentence lede.
The sandboxes are cartoons of DNA origami placement physics:

**Kinetic** — the race against material clocks.
1. **CompetingClocks** — time slider 0–5 h drives sigmoid HMDS hydrolysis,
   abrupt background-adhesion onset at T≥4 h, and patch staling at T=3.5 h.
   Concentration slider scales emit rate. HMDS-efficacy bar and site-status
   indicator give two readouts of the hidden state.
2. **DiffusionModes** — single toggle: sticky vs. non-sticky HMDS.
   Demonstrates that binding-site filling comes from the 2D HMDS pool, not
   direct solution arrival.

**Chemistry** — surface and ionic tuning.
3. **SurfaceLineup** — Mg²⁺ / Ni²⁺ / APS side-by-side, hand-animated SVG.
   Shows surface-dependent ordering vs. fragmentation.
4. **ScreeningOvercharging** — [Mg²⁺] slider; halo flips from attractive to
   repulsive past 0.8; standoff height grows in the side view.

**Geometry** — origami stiffness vs. cavity shape, and the tunneling gap.
5. **CavityConformance** — layers slider 1–4 controls origami floppiness;
   conformance vs. bridging emerges. Pulls live geometry from a chip recipe
   keyed off the active design.
6. **TunnelingWindow** — window-cut checkbox; gated on whether Pt is
   exposed in the cavity for the active chip. Shows the active site (green)
   jumping to the cavity floor when the window opens over exposed Pt;
   otherwise it stays at the origami underside (red).

The four kinetic/chemistry sims share a common engine, **ParticleSandbox**
(~600 lines): a 2D Langevin column with ellipsoidal 3D tumble, a particle
state machine `air → hmds → orienting → bound (or stuck)`, and two coupled
orthogonal renderers (top view + front view). Levers exposed:
`hmdsStickiness`, `bgAdhesion`, `emitRate`, `solutionPopulation`,
`autoResetMs`. SVG, no Three.js.

Underlying literature: Kershner 2009; Gopinath & Rothemund 2014; Gopinath
2016 (ACS + Nature); Gopinath 2021 *Science*; Rishabh 2021. Plus molecular
electronics (Fuller 2022) and metallization (Liu 2011, Pearson 2012, Ye
2021). The sims are cartoons of the physics in those papers, sharpened by
domain expert input.

The whole page was implemented in roughly four days with no new
dependencies. That tempo is itself a finding — see §5.

---

## 3. What Earth Primer and Gelbox teach us

Both projects converge on the same handful of moves; the placement page
hits some and misses others.

**Always running by default.** Earth Primer never shows a blank canvas.
Gelbox starts with a populated default sample. *We currently do this on
every sim — keep it.* Don't ever ship a sandbox whose first frame is "press
play to begin."

**Time as a first-class control.** Gelbox's time slider is the star of the
app: band positions are a pure function of `t`, so scrubbing is exploration,
not playback. Earth Primer compresses geological timescales until causality
is visible. From the talk, demoing Gelbox: *"This usually will take like
two or three hours, but we'll just do this in five seconds. So we just drag
the time slider and you can see all those bands are separating."* (Douglas)
*CompetingClocks does this well; the other five sims treat time as
background motion. There's room to make more sims time-scrubbable — a
natural next move.*

**Visual idioms encode physics.** Gelbox's "flames" (mass anomaly),
smearing (degradation, buffer effect), and band brightness (mass) aren't
decoration — they're the data. Earth Primer's painterly terrain isn't
aesthetic restraint, it's a deliberate choice to make the *world* visible,
not the *tool*. *In our work: the standoff-height growth in
ScreeningOvercharging, the conformance/bridging swap in CavityConformance,
and the active-site jump in TunnelingWindow are good. The HMDS-efficacy bar
in CompetingClocks is functional but reads as instrument, not artifact —
could be more painterly.*

**Direct manipulation over forms.** Gelbox: drag bands, drag samples,
Cmd-click for loupes. Earth Primer: brush terrain with your finger. *We
use sliders and checkboxes — the lightest possible direct controls. We
don't yet have any "grab the artifact itself" gestures (e.g. drag an
origami onto a patch). That's a frontier worth exploring for whichever sim
most tempts the user to grab.*

**Linked views for hidden geometry.** Gelbox's loupes drill from gel-band
scale to molecular scale: *"You have this kind of magic microscope that you
can mouse over and zoom in and look at what's in any location in the gel.
So all this phenomena is normally totally invisible, but now you can see
it."* (Douglas, on the talk demo). Gingold's framing in the same talk:
*"multiple, simultaneous linked views into the same phenomena."* *We use
top + front views in ParticleSandbox — same idea, different axis.* Anywhere
a 2D representation hides important 3D structure, two views beat one
rotating 3D model.

**Strategic abstraction.** Earth Primer makes glaciers move in seconds.
Gelbox renders smearing as a static gradient instead of integrating
diffusion. *Our cleanest example is CompetingClocks compressing 5 hours of
materials chemistry to a 5-second slider.* The rule: distort timescales and
resolution freely; preserve causal structure.

**Tuning lives in code, not UI.** Gelbox's `tuning.json` exposes ~40 knobs
*to the developer* but ships only ~6 sliders to the user. *We've been
disciplined about this — most sims expose 1–2 controls, and ParticleSandbox
holds dozens of constants internally.* Resist the temptation to surface
every parameter; each control should teach a concept, not document an
internal.

**Page narrative wraps the sandbox.** Earth Primer's chapters supply the
*why*; the simulation supplies the *how*. *Our section ledes (Kinetic /
Chemistry / Geometry) and per-sim captions do this. Captions are short,
which is right.*

**Onboarding by responsiveness, not tutorial.** Earth Primer never has a
"How to play" screen; the world reacts to your touch and you learn by
poking. Gelbox assumes prior knowledge (audience is biochemists). *Our
audience is the same — domain scientists with PhDs. We can rely on
poke-to-learn. Tooltips on hover are fine; modals are not.*

**Make failure interesting.** Gingold in the talk, on what simulation games
get right: *"things often go wrong, and when they do go wrong and your city
burns down or some calamity happens, it's actually kind of fun and lets you
play around with the system and understand that it's actually quite
fragile. You can learn about your agency and the dynamics of the system."*
Gelbox bakes this in — wells damaged by a slider, voltage too high,
terminals reversed. *We don't currently have any failure-state demos. The
placement equivalent is obvious: a sim where the user can dial conditions
into a regime that wrecks placement (HMDS too aged, ionic strength too
high, origami too floppy) and see the wreck. Worth a sim.*

**Things both projects use that we don't (yet):** sound design (Earth
Primer's eruptions, Gelbox's electrophoresis hum), gradual unlock across
chapters, and an explicit free-play mode that composes the chapter tools.
Worth a deliberate decision per sim, not a default.

---

## 4. What *Building SimCity* adds

Gingold's book is the only book-length close reading of a simulation toy I
know of, and it surfaces moves that Earth Primer and Gelbox use but don't
articulate. A handful translate directly to sandbox work in this lineage.

**Simulation as analogy, not model.** Gingold's load-bearing claim, traced
back to Vannevar Bush's differential analyzer: simulations don't *model*
phenomena, they *enact analogies* with them. The job of a sandbox author is
to find and stage the right analogy — the one whose dynamics rhyme with the
target, with the unimportant detail dropped. When we say a sim is a
"telescope" (§1), we are halfway there; *analog*, in the original sense
(not the audio-engineering one), is the more rigorous word. Asking *what is
the analogy* sharpens the design more than asking *what are we modeling* —
it forces a decision about which structural relationship in the target the
sim must preserve, and which can be sacrificed. CompetingClocks's analogy
is a sigmoid + a step + a decay; ScreeningOvercharging's is a sign-flipping
halo at a threshold. State the analogy in the spec, in one line, before
opening a tsx file.

**Two clocks, one fast and one slow.** SimCity has a 60 Hz real-time clock
(UI, sprites, animations) and a separate simulation clock (taxes, growth,
decay, pollution) whose speed the user can change. Animating tiles never
stutter even when the city is computing tax-year aggregates.
ParticleSandbox already has this latent — particle Brownian motion is
real-time, while the HMDS-efficacy decay is on the time slider — but we've
never made the dual-clock structure explicit in the engine. Naming it makes
the next sim cheaper to design: decide which subsystem rides which clock,
and the rest follows. The corollary: things that ride the real-time clock
should never visibly stutter when the simulation clock is busy, even if
that means time-slicing the slow work. (Implementation detail in
[`sandbox-engine.md`](sandbox-engine.md) §2.)

**Round-trip between local detail and global aggregate.** SimCity's
signature move — and Wright's hardest design problem, by his own account
("the challenge was to juggle the resolution of each individual calculation
so that they fit together correctly and were measured in a synchronized
time pattern") — is a loop: Map Scan walks every zone and tallies a
citywide census; Set Valves runs a system-dynamics demand calculator on the
totals; the resulting demand is pushed back as a probability bias on local
zone growth. Local makes global; global biases local; cycle. Most of our
sims live entirely at the local scale (one HMDS pool, one cavity). A future
sandbox that closes this loop — e.g. a two-panel sim where the spatial
pattern of bound origami feeds a global "yield" indicator that in turn
biases local emit rates or staling thresholds — would unlock dynamics we
currently can't show, and would be the cleanest way to demonstrate that
placement statistics emerge from microscopic kinetics rather than being
prescribed.

**Life on the edge of chaos.** From Wright via Gingold: "Too much chaos and
the feeling of coherence is lost. Too much order and the system feels
dead." The instabilities, time delays, and feedback loops in SimCity are
deliberate — they are what make the world feel alive. CompetingClocks's
onset-at-T=4 step and patch-staling at T=3.5 are crude versions of this;
the smoother version is a sim whose parameters can be dialed *into* and
*out of* the unstable regime, not just over a single threshold, with the
user watching the regime change as it happens. This reframes "failure is
content" (rule 13) — failure isn't a separate mode you switch into, it's
what's on the other side of a continuous parameter sweep. Worth designing
for explicitly.

**Implied beats simulated.** From Wright: "There are certain things we just
cannot simulate on a computer, but on the other hand that people are very
good at simulating in their heads. So we just take that part of the
simulation and offload it from the computer into the player's head."
SimCity doesn't actually simulate trips between buildings — zones spawn
invisible probes that walk the road graph, and players see only smeared
traffic and assume the rest. Players also believe every power plant must be
wired into the grid; the simulation only requires the first one. The
illusion holds because players bring their own model. Our binding-site
stickiness is in this spirit; we should watch for places where adding
fidelity would crowd out the imagination work the user is already doing for
free.

**Two message channels: organic and observational.** SimCity has (a)
messages that emerge from simulated events ("A plane has crashed!",
"Insufficient funds"), and (b) `Send Messages`, an observer that watches
city statistics on a schedule and emits commentary ("Citizens upset. The
tax rate is too high"). Our captions are pure authorial commentary, fixed
at design time. There is room for an *observer* on a sim — e.g.
CompetingClocks emitting "patches are staling — the binding window is
closing" when the time slider crosses 3.5 h, or ScreeningOvercharging
emitting "you've overshot — the surface now repels" past 0.8 [Mg²⁺] — that
uses the same prose voice as the captions but earns its words from the live
state. This is the cheapest way to add the "playmate" quality Gingold
credits with much of SimCity's holding power, without taking on a tutorial.

**Magic-crayon authoring.** When the player drags a single road tile in
SimCity, the program picks the right T-, L-, +-, or —-shape so the network
looks continuous. The player draws intent; the program fills in plausible
detail. This kind of small, automatic authorial assist is the difference
between a sandbox and a CAD tool. ParticleSandbox does a faint version when
a binding site auto-orients a particle into the patch. The next sim that
lets a user "draw" anything (a pattern of patches? a path the origami
should follow? a custom electrode geometry?) should pick up the crayon:
take the user's gesture as a sketch and have the program draw the
connecting structure.

**The development tool becomes the toy.** Bill Budge's *Pinball Construction
Set* was originally his table editor for *Raster Blaster*. Will Wright's
City Planner was originally Wedit, his world editor for *Raid on Bungeling
Bay*. Both authors became more interested in the tool than the game it was
meant to author. Our equivalent is ParticleSandbox itself — written for
CompetingClocks, then absorbed into three more sims. The pattern is general
enough to be a rule: when the next sim demands a tool, ask whether the tool
is the actual deliverable. The corollary for §5 rule 10 ("build a reusable
engine before the second instance"): the engine isn't just a cost
amortization, it's often the most exciting thing in the project.

**Names earn their keep.** "City Planner" → "Micropolis" → "SimCity" took
two retitles to land — Wright's working title was a job description; the
shipping name was a place. Our sandbox names (CompetingClocks,
DiffusionModes, ScreeningOvercharging, SurfaceLineup, CavityConformance,
TunnelingWindow) are functional and load-bearing on the science. They're
fine for now, but a more playful name on a future sim — something with the
absurdity Gingold flags as a play signal — is a cheap test of whether the
artifact is meant to be a tool or a toy.

**Suspending judgment.** Gingold: "SimCity helps you understand what
happened but does not tell you how you should feel about it." Our sims are
mostly judgment-free, which is right for a scientific audience that will
resist being told what's "good." CompetingClocks comes closest to passing
judgment via patch-staling (the simulator declares the late regime a
failure); worth being explicit in the caption that this is the simulator's
framing, not nature's, and that the actual placement window in real
conditions may differ from the cartoon's.

---

## 5. Generalized rules for new sandboxes

A working list, in priority order. These aren't theoretical — each one is
something we have or could have applied on the placement page.

1. **One concept per sandbox.** If you can't write the caption in one
   sentence, split it.
2. **Default to running.** First frame is alive. The "off" state should
   require an explicit action.
3. **Expose 1–3 controls, no more.** Each control teaches a concept. Tuning
   constants stay in code. (The "1–3" is the *visible* surface, not
   capability — capability stays in code, or behind an Advanced disclosure.
   A common trim cuts visible knobs from ~14 to ~8 by hiding, not
   removing.)
4. **Prefer scrubbable time over auto-play.** A slider you can drag back is
   better than a loop you watch.
5. **Two views beat one when geometry is hidden.** Top + front, gel +
   loupe, map + cross-section.
6. **Encode physics in visual idioms.** Color, motion, deformation should
   *mean*, not decorate. If a feature is purely cosmetic, cut it. The sharp
   form of this rule: when state→geometry is one function, the function *is*
   the visual idiom. Worked example: `landingFold(rigidity, grab,
   contactPhi)` at touchdown produces three render kinds (flat / taco /
   diagonal) from a single function rather than three branched code paths.
   Visual richness comes from the function, not from branching.
7. **Linked but loose.** Sims on the same page should reference the same
   physical setup but not share state — failures should be local.
8. **Cartoons over fidelity.** The goal is intuition, not prediction. If
   you can't decide between accurate and clear, choose clear and note the
   cheat.
9. **Captions wrap the sandbox.** Section lede ≤ 1 sentence, sandbox
   caption ≤ 1 sentence. The user's eyes go: title → caption → sandbox →
   tinker.
10. **Build a reusable engine before the second instance.** ParticleSandbox
    paid for itself by sim 3.
11. **Aesthetic warmth is not a luxury.** Soft palette, generous
    whitespace, motion eased rather than linear, tactile feedback on click.
    The instrument-panel aesthetic signals "work"; we want "explore."
12. **Ship as part of a page, not as a page.** A sandbox is a paragraph in
    an essay. The narrative around it does as much teaching as the sim.
13. **Failure is content.** A regime where things break is as instructive
    as the regime where they work. If a sim has only a "good" attractor,
    you've thrown away half the teaching surface.
14. **Snap then dial past it.** Presets are pure reducers `(state) =>
    state`, not modes. An `activePreset` pill highlights the focal knob.
    Any direct edit demotes back to Free Play. Makes presets feel like
    starting points rather than cages, and means every free-play state is
    reachable from a preset by tweaking. The alternative — each preset
    locks its set of knobs — is what you get if you don't think about it.
15. **Discrete picker + continuous override.** A discrete picker (e.g.
    `surfaceChem`: mica+Mg / APS / Ni²⁺) snaps a continuous knob (e.g.
    `surfaceGrab`) to a known-good default; the user can dial past. Honors
    the existing vocabulary while letting the user "play with the edges of
    what we know."
16. **Variations are data, not code paths.** N variants of a sandbox are N
    rows in a registry, not N branches in code. Adding the (N+1)th is one
    entry. Same shape as preset definitions and chip recipes.
17. **Action-as-timestamp.** Treat one-shot actions as `actionAt: number |
    null`, not `actionFired: boolean`. The engine reacts on the next frame
    after `actionAt` changes. Robust to fast clicks; trivially extensible
    to history scrubbing. Same pattern fits "rinse," "snapshot," "save
    state," "reset to bound."

---

## 6. Process: how to build the next one

The four-day cadence on the placement page is repeatable if you keep the
workflow tight:

1. **Brainstorm + scope** with a domain expert. Output: which single
   concept this sim teaches, in one sentence. Reject anything that doesn't
   fit in one sentence.
2. **Find or invent a visual idiom** for the hidden quantity. Sketch on
   paper or in cartoon-style helpers before opening a tsx file.
3. **Write a short design doc.** Date-prefixed. Include API for any new
   engine, levers exposed to the user, and the caption.
4. **Decide: reuse the existing engine or hand-roll SVG?** A particle
   engine is the right answer when particles, surfaces, and binding are
   the subject. Hand-rolled SVG is right when a few key frames or a simple
   parametric animation tells the story.
5. **Implement bottom-up:** physics state → visual idiom → controls →
   caption → wire into the page. Captions go in *early* — they discipline
   the design.
6. **Verify on `file://`** before claiming done — the dashboard must run
   from a USB stick. `npm run build && open dashboard/index.html`.
7. **Have someone else play with it for 60 seconds.** If they don't get the
   concept without prompting, the visual idiom isn't carrying the load.
   Iterate the idiom, not the controls.

For the most complex single piece (a new engine or a fundamentally new
interaction), write a hand-off prompt as a standalone doc. The act of
writing the prompt forces the design to a level of crispness that the
actual coding can't.

---

## 7. Open questions for the next pass

- **Sound.** Earth Primer and Gelbox both lean on it; we have nothing.
  Worth a one-day experiment on one sim (probably a kinetic one: an
  audible hum when patches are active, fading as they stale).
- **A "free play" / composite sim.** Earth Primer's chapter 5 and Gelbox's
  main view both let the user combine all the chapter tools. We have
  nothing equivalent. Could be a seventh sim that exposes all six concepts
  as live knobs.
- **Persistence across refresh.** Currently zero. `localStorage` is fine
  for UX state — worth using for at least the chip selection and
  last-touched slider position.
- **Gradual unlock.** Earth Primer locks the sandbox until users have read
  the chapters. Scientific audiences will resist this, but a "first visit"
  affordance (e.g. start with one sim expanded, others collapsed) might be
  a soft version worth trying.
- **Touch / mobile.** The page is responsive but interactions are
  mouse-tuned. Reviewers may pull this up on a tablet. Worth one round of
  touch testing.
- **Direct grab.** No sim currently lets the user manipulate the artifact
  directly (drag an origami, drag a patch). One well-chosen instance of
  this would change the feel of the page disproportionately — Gelbox's
  drag-a-band is the existence proof.
- **The InterPlanetary talk made the case once already.** Re-watching it
  before scoping the next sim is a cheap way to recalibrate.
- **An observer / coach on at least one sim.** SimCity's `Send Messages`
  system is the cheapest way to add narrative liveliness without taking on
  tutorial overhead — see §4. CompetingClocks is the obvious candidate: a
  single-line commentary slot under the caption that the engine writes to
  from sim state ("HMDS efficacy peaking", "patches staling", "binding
  window closed"). A few hours of work; would change the felt weight of
  the page.
- **A round-trip local↔global sim.** None of the six sandboxes closes the
  loop where a microscopic pattern aggregates into a global statistic that
  then biases microscopic dynamics. This is the SimCity move (§4) and the
  cleanest demonstration of the placement story. One sketch: a two-panel
  sim with the ParticleSandbox column on the left and a running tally of
  bound-site coverage on the right, where the global yield indicator gates
  a parameter the user expects to control directly. Worth a half-day
  prototype.
- **Name the next sim with the right tone.** The current names are
  scientifically faithful and emotionally flat. *Building SimCity* (§4) is
  a reminder that the name is the box, the box primes the imagination, and
  a more playful name is a cheap test of whether the artifact is a tool or
  a toy. Try the renaming before the implementation, not after.

---

## References

- Gingold & Douglas, *Sandboxes to Think and Play With*, InterPlanetary
  Festival, Santa Fe Institute, June 7 2018.
  https://www.youtube.com/watch?v=_poJx7XrABY
- Earth Primer (Chaim Gingold, 2015). https://www.earthprimer.com/
- Gelbox (Douglas Lab + Chaim Gingold, 2018). Press kit:
  http://douglaslab.org/gelbox/presskit/
- Chaim Gingold, *Building SimCity: How to Put the World in a Machine* (MIT
  Press, 2024).
- Nicky Case, *Explorable Explanations: 4 More Design Patterns*.
  https://blog.ncase.me/explorable-explanations-4-more-design-patterns/
- Bartosz Ciechanowski, longform interactive essays. https://ciechanow.ski/
- Placement literature: Kershner 2009; Gopinath & Rothemund 2014; Gopinath
  2016 (×2); Gopinath 2021; Rishabh 2021.
- [`principles.md`](principles.md) — the dashboard-layer companion.
- [`sandbox-engine.md`](sandbox-engine.md) — the engine-layer companion
  (engine architecture, two-clock discipline, fork seam, state shape as
  spec).
