# Selective World Liquor HUD repair: 0.1.73 source draft

Base: current canonical main af629a089d8d1fe3e210187b211e2f533f3ae4d3, including the reviewed Java mixology/color/Highball work merged in PR45. This is a frozen development-source draft, not a release or complete adaptation claim.

## Narrow functional change

The existing namespaced effect panel receives only 480 explicit sibling-scope flags and one capture-predicate precision correction from 12 to 18 UTF-8 bytes. Controls, textures, layout, packet contents, zero-duration transport, cache semantics and native HUD roots are unchanged. The preserved source is PR43 commit 5ae1a6f90c0d4bceabe6292a9a97bd04e8234628; no old recipes or motion code are imported.

## Current gameplay preserved

- All 18 shaker recipes and 56 descriptors
- Brown, orange, light-blue and pink registrations
- Both Highball recipes and the current 600-second creative-flight registration
- All 128 current item-tag changes, guide data, effects, furniture, textures and models
- The payload changes only its release/protocol label to 0.1.73

Existing unimplemented or unverified flight behavior stays explicit; this HUD patch does not implement or certify flight.

## Unfinished identity and approval gates

Own identity 73 is new and uniquely frozen after focused identity checks. Both host dependencies require T113. Exact public source is pinned to 3a25d23a9643bad4883892ca0cf7221261b535f2, whose tested tree is 8773a17b4cf247bb52fa0fda13ab3b5b964ad476. This host integration retains the current Java adaptation and excludes rejected T111/T112 motion changes.

The owner explicitly approved local repairs and Git drafts before the missing BSM upstream-status report is obtained. Reading and refreshing BSM addon_quality/senluo-java-upstream-status.json remains mandatory before merge, release or deployment. It is not available in this draft verification evidence.

The current family Java tracker records distinct Forge, NeoForge and newest-Minecraft branches, with partial source coverage and outstanding adaptation gaps. This patch makes no latest-author or full Java-parity claim.

Necessary preservation/HUD checks and exact-source CI follow this checkpoint. BSM verification, native client acceptance, release, live installation and production readiness remain unapproved.
