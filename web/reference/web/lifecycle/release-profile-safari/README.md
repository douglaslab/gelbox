# Shipping Safari sample-view background/resume

On Safari27.0.1 (22625.1.29.11.28), macOS27.0.1 arm64, opened the staged
website at http://127.0.0.1:8766/gelbox/app/#/gel in a new tab. The served
release manifest identifies runtime812ff8a; website checkout03d8cf9.

Clicked lane1 to open the startup ladder sample, observed its populated
animation, and Command-S downloaded before.json. Switched to the actual Safari
Start Page tab (AX confirmed Gelbox off and Start Page on), then returned to
Gelbox. The sample panel remained populated. Two successive visible screenshots
showed changing particle positions after returning. Command-S downloaded
after.json; complete parsed documents are exactly equal, without normalization.

UI observations were made through CUA, not synthetic visibility events or
Playwright WebKit. Screenshots were inspected in-session, not retained as
lossless artifacts; document downloads are retained. This does not measure
background frame cessation, internal view identity, persistent-loupe behavior,
OS sleep or physical display-scale changes. Those broader W07 requirements
remain open. No product changes or new browser permissions were needed.
