# Qualified Intel simulation reference profile

Reproduce from the repository root:

```sh
python3 reference/native/numerical/build.py --profile release-x86_64 --capture
```

The script extracts pinned Gelbox5f51097 source, checks clean pinned Cinder and
Boost dependencies, generates adapters, configures x86_64/O3 and applies
-ffast-math only to GelSim.cpp. It builds only gel-numerical for this profile,
checks two byte-identical509-case captures, and writes outputs/provenance here.
Default strict capture and its particle/mesh outputs are preserved separately.
No algorithm is rewritten in the C++ reference.

The output is byte-identical to
../../replay/overlapping-tiers/intel-fast-recovered/output.json. That independent
clean build matches nine integer and three fractional-shape original-app solver
saves. The original Xcode Release configuration enables fast math. Modern Cinder
and compiler differ from the distributed original; GUI evidence and original
instruction inspection supply case-specific qualification rather than a claim
of complete executable equivalence.

The five numerical/picking/solver/loupe/molecular unit suites and the multimer
browser drag test now select this profile; their assertions/tolerances are
unchanged. The historical strict capture remains byte-identical to its prior
committed version. Main unit suite:3100 passed. Web build passes. The targeted
multimer drag browser check passes8 cases. Full production and compatibility runs pass120 and100 cases respectively.
The full visual run passes969 cases with one existing skip. All three full
browser runs completed with exit0.

The first compatibility launch failed during discovery because the external
Playwright1.64 runner lacked pngjs. Linking the existing repository dependency
allowed discovery; the initial log is retained. Product code and assertions were
not changed to address the runner dependency.

This reference integration does not close remaining native modifier/occupied-
loupe traces, physical platform checks, memory-footprint acceptance, distribution
decisions or final user review. The website remains on its previously staged
revision until the runtime candidate's full regression checks pass.
