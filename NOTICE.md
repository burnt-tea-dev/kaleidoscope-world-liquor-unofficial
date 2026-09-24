# Attribution and source

This is an **unofficial** Minecraft Bedrock port of Kaleidoscope World Liquor,
by ChenjdyUltra and bf_meow. The upstream 1.1.8 NeoForge 1.21.1 JAR is pinned
by URL, file ID and SHA-256 in `upstream/source.lock.json`.

The pack requires Kaleidoscope Tavern (Unofficial), which itself requires the
Kaleidoscope Cookery Bedrock port. Tavern's public extension SDK and geometry
conversion helper have been copied under the Tavern code license included as
`LICENSE-TAVERN-CODE`. Selected Tavern models are needed to resolve parent
references and are covered by Tavern's asset license.

Java-side source files are not included. The conversion process reads the
original resource JAR and selected implementation behavior was checked against
its decompiled classes. `runtime/` contains generated Bedrock assets and
new Script API code, while `upstream/` preserves the pinned resource input.
