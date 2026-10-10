# Display P3 and Adobe RGB decoder comparison

Five fixtures extend the corpus to 21: opaque PNG and JPEG with Display P3 or Adobe RGB profiles, plus translucent Display P3 PNG. The generator tags existing sample values without converting them. Named macOS profile hashes and input hashes are retained in the native corpus. The existing Quartz executable produces the native RGBA references; binary/source hashes are recorded here. No production behavior changed.

Actual compiled file drops are compared with native raw texture bytes on Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2. Opaque PNG matches exactly in all four cases. JPEG matches exactly in WebKit and differs by at most one channel level in Chromium/Firefox, the same existing D06 boundary. The transparent P3 output is byte-identical to the untagged alpha fixture in native and each browser. WebKit therefore retains its known loss of fully transparent RGB and at most one level of visible straight-RGB rounding; premultiplied values match for this fixture.

The first WebKit run failed because the new alpha fixture reached the opaque-PNG exact-byte assertion. Native and browser byte comparisons proved it has exactly the already-recorded alpha behavior. The same explicit alpha assertions now apply to both named fixtures; this does not declare D06 accepted or claim the decoder was fixed.

Final targeted checks: four production image tests and four Firefox/WebKit image tests passed. Reports and raw browser bytes are retained. These checks certify the supplied profiles and decoded sample values, not monitor color management, arbitrary ICC profiles, filtered alpha composition or original-release GUI rendering. W06 remains open for those applicable rendering scenarios.
