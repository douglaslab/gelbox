# Representative compositing reference

36 images cover nine body-only particle snapshots at DPR1/2 over the native
well fill (#F1F1F1) and white application background. Shapes include complete and
degraded ellipses, multimers and a narrow remnant; fades range from .01 to 1.

The pinned `gel-mesh` executable runs unchanged native `Part::makeMesh()` and
root-transform code. All input selection/rollover flags are false, so it emits
only the representative's body. Its center remains at (100,100), equivalent to
native representative drawing when source and destination centers coincide.
This does not exercise most-visible-particle selection or translated placement.

The capture script checks the native executable hash, repeats native mesh output,
then renders each case twice on native CGL RGBA8 with MSAA4 and Cinder's default
straight-alpha source-over blend. It independently checks pinned Layout's well
fill, the application's white clear, and FragmentView's representative draw call.
A verification invocation compares all retained RGB pixels without rewriting.

```sh
python3 reference/native/modern/representative-scenes/capture.py
```

`--mesh-build` changes the default `/tmp/gel-native-numerical` build location;
`--update` deliberately recaptures native data. The manifest records revisions,
source/driver/executable/mesh/image hashes and scope. This is a native standalone
raster reference, not an original-release GUI capture. Well borders, rounded
corners, shadows, overflow and full panel composition are not yet represented.
