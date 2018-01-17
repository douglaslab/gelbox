# TODO

- Get Y = bases mapping correct
- Degradation UI
	- Some kind of flow chart UI for seeing live outcomes? maybe shift drag or something, so it's not immediately apparent, but direct manpulation is?

## Shawn rolling feedback:

### 1/16/2018
- the aspect ratio has a relatively small effect on mobility, maybe 10-20% as much as size.
- we might think about how to specify discrete aggregation (which might make a mixed population of monomers, dimers, timers, etc) and transient aggregation which makes things smear out
- we should add the gel "wells" at some point, in addition to the tube (you might revisit some online animations if we haven't discussed for a while). max aggregation causes stuff to all get stuck in the well.
- curious how it looks with lower fill opacity on the white "zoom wedge" region, or just lines? once the gel is more populated would gel bands be obscured?

## Chaim feedback/notes

## New Particle / Fragment Sim + UI

√ Clean up deprecated UI, etc... from milestone 1

### Icons
- Fix aliased icons
- Fix concentration icon design (per Shawn)
- Fix fragmentation icon design (per Shawn)

### Particles
- Make into strings (allow both visualizations?)
√ Fix aspect ratio; should maintain surface area (i fixed by maintaining area; math is hard for surface area)
- "Bite" effect for degradation.
- Performance issues
- Fading/picking issue. (No aging out? No fade out while mouse in view, or near particle?)
	√ No aging out. See if it's still an issue with Shawn.

## Per 12/12/17 discussion with Shawn
- Choose ml amount when inserting into a gel (pipet interface, like click-click (or click-hold) to draw up and click again to put down?)
√ Timeline should just be 0..1, always insert at time=0
√ New bases, mass model
√ Add degrade to model
√ Get 1kb ladder as test data in (yeah, but y=bases function isn't right)