# Installed Intel math-library diagnostic

Read-only inspection located libsystem_m in the current macOS Rosetta x86_64
shared cache, without launching an Intel process or attaching to Gelbox.
`cache_inventory.py` reads cache mappings and the dylib export trie. The mapping
layout follows Apple's [dyld cache header](https://raw.githubusercontent.com/apple-oss-distributions/dyld/main/include/mach-o/dyld_cache_format.h);
Mach-O structures come from the installed SDK's mach-o/loader.h. The installed
cache map identifies the library text at 0x7ff81481c000.

The _powf export has a resolver. Its instructions test bit0x10 of the byte at
0x7fffffe00023 and select 0x7ff8148330e0 or 0x7ff814832e30. `pow_probe.py` tests both
implementations under Unicorn2.1.4, requiring the exact recorded library text
hash first. No Apple library bytes are distributed with this evidence.

At base .7859917879104614 and exponent 3.700000047683716, the scalar implementation
returns .41024816036224365, matching rounded JavaScript Math.pow rather than the
arm64 host's .41024813055992126. The alternate implementation stops at
0x7ff814832ec7 with UC_ERR_INSN_INVALID, even with a Haswell CPU model and AVX
state enabled. Its result is unmeasured. The actual resolver selection in the
original running app has not been read, so this does not qualify its math
boundary or justify replacing the two failing diagnostic expectations.

Run with Python and unicorn==2.1.4 installed:

```sh
python reference/native/replay/overlapping-tiers/intel-math-diagnostic/cache_inventory.py
python reference/native/replay/overlapping-tiers/intel-math-diagnostic/pow_probe.py
```

Both previous native Intel diagnostic processes remained in kernel U state at
the prerequisite check, despite earlier termination requests. No additional
translated process was started. Native reference GUI and all product files
were untouched by this diagnostic.

## Rejected alternate-variant experiment

`experimental_fma_probe.py` attempts to handle only the encountered
vfmadd213pd/vfmadd231sd instructions using exact rational multiply/add followed
by one binary64 rounding, checking each fused result against host `fma`.
The instruction semantics were checked against the [Intel instruction manual](https://cdrdv2-public.intel.com/825743/325462-sdm-vol-1-2abcd-3abcd-4.pdf).
Other unsupported instructions stop execution.

Although this lets the alternate path return, its .41062676906585693 result
fails the independent 80/160-digit Decimal power controls, both of which round
to .41024816036224365. The complete AVX emulation/hook interaction is therefore
not qualified. This experiment must not be used as native truth or justify
changing product arithmetic. The scalar-path observation remains bounded to
that path; original-app confirmation remains pending. Further emulator work is
not the next release task.
