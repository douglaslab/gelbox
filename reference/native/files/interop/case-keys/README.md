# Native JSON case lookup

The original-release palette capture contained both `Name` and `name`, and the
native save chose `Name` despite its later input position. This corpus extends
that observation with the existing pinned native file harness. Sample inputs
have identical mixed-case fields and conflicting names in opposite insertion
orders. Both native outputs are byte-identical. The gel input also varies root,
collection, context and buffer field case. Values are exact binary fractions
or integers to isolate key lookup from numeric conversion.

Cinder JsonTree defaults `caseSensitive=false`; `getNodePtr` walks children and
uses ASCII case equality. Jsoncpp presents parsed object members in sorted key
order, so the first case-insensitive match wins. For `Name` and `name`, uppercase
wins even if the lowercase spelling exactly matches the requested field.
String values (including dye names and file type) are not case-folded.

The web native decoder now uses this lookup for header, sample, fragment, buffer
and gel fields. Its existing finite-number, integer, collection and color
validation remains in place. Canonical export field spellings are unchanged.
A malformed preferred alias is rejected rather than silently using a later valid
alias. The legacy web schemas and XML parser are not changed.

Four new unit cases failed before correction. Three compare independently
captured native outputs and one checks invalid alias values. Four browser cases
exercise actual Open and Save of mixed-case Sample and Gel files with exact
export equality on both renderers. The all-palette browser replay now uses the
unmodified original `capture-input.json`, including its conflicting names, and
matches the original-release output exactly.

Run `python3 capture.py [native-harness-path]` to verify all captures. Build
provenance and limitations are in `../build-provenance.json`: native constructors
and writers, modern compiler/Cinder, no GUI dispatch. The original release GUI
confirms the conflicting name case separately; the whole mixed-case corpus has
not been replayed through its GUI. This is not broad malformed-file equivalence
or full application parity certification.
