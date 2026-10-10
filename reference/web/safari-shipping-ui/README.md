# Shipping Safari UI and native-file roundtrip

Shipping Safari27.0.1 (22625.1.29.11.28) opened the compiled app through localhost
Vite preview. Actual UI actions verified startup gel rendering, opening a sample,
creating a species, changing its color, opening gel settings, selecting H2O and
switching Render off and back on. Screenshots retain species and direct-render
settings/menu states; they are observations, not exact native comparisons.

Open imported the native ladder fixture through Safari's file picker. Save Gel
requested a local-site download permission, which Shawn explicitly approved and
accepted in Safari. The downloaded ladder-1kb-gel.json is retained here and is
exactly equal to the native fixture after JSON parsing (formatting bytes differ).
The fixture path, download and built asset hashes are recorded in provenance.

Safari WebDriver initially refused a session because remote automation is disabled;
that setting was left unchanged. The file picker required double-clicking its
resolved Go To result after keyboard confirmation did not work through the UI
tool. Import itself then succeeded normally. No product change was necessary.

This is bounded shipping-browser evidence. It does not establish GPU backend
identity, console/resource checks, subpath deployment, full interaction/lifecycle
coverage or native RGB parity. The user's live Safari test tab and preview server
remain available; subsequent user edits are outside this recorded sequence.
