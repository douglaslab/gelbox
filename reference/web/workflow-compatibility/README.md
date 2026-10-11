# Hidden-lane and mixed-file compatibility

The existing compiled hidden-lanes and file-workflow tests are now included in the regular Firefox/WebKit compatibility configuration. Eight targeted cases pass: mixed gel editing and save/reopen, queued mixed drops and occupied/full lanes, and lane reduction/restoration with and without a persistent loupe, in each engine.

The initial run passed seven cases and timed out in WebKit before the first save button could be found. FileControls waits for the asynchronous file load before closing the menu; this test was only waiting for the already-open gel settings panel. It now waits for the menu to close after import, as other compiled import tests already do. The unchanged product passes the corrected sequence. Initial failure and corrected logs are retained. This is browser workflow evidence, not completion of pending original-native persistent-loupe or mixed-drop traces.
