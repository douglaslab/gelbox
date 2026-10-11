# Original-native dye transfer

The original native application opened input.json, selected the Xylene cyanol band at screenshot (1164,468), and dragged it to (448,600). The destination already contained 80 mM Xylene; the source contained 70 mM and a separate 700 bp DNA species. The destination displayed 125 mM, the capped merged concentration, and the source retained its DNA.

native-destination.json is the original Save Sample result. native-after-transfer.json is the original Save Gel result: its defective keyed Samples object retains only the source. The compiled comparison reconstructs the accepted lane-preserving save using the independently saved destination and retained source. It does not claim direct equality against the defective whole-gel native document.

The production test compares the complete destination sample and reconstructed gel, including all metadata and non-mass dye fields; checks selection, disabled buffer controls and remaining bands; and retains screenshots and downloaded documents. Chromium WebGPU/WebGL2 and Firefox/WebKit WebGL2 pass (two production and two compatibility tests). No runtime changes were necessary. Native GUI frames were inspected during capture, not retained as pixel goldens. This covers an unmodified capped same-dye merge; modifier cloning and other dye branches remain open.
