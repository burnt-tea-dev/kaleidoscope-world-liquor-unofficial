# 0.1.137 — all incense surface repair

Synchronizes BP and RP dependencies to Tavern 0.6.159 and advances the World Liquor release identity to 0.1.137. No liquor gameplay changes.

Required CI and full-family stopped-save/admission/live readback are separate gates. Rendered-client acceptance remains pending (`client=false`, `production_ready=false`). Existing shaker insertion and eating/mixology UI investigations remain open.

Supersedes the uninstalled T158/W136 candidate: CI correctly rejected mixed material render methods. Every incense material now uses the same culled cutout method, including body and open contents. Failed evidence and frozen release identities remain preserved.
