# 世界名酒 0.1.69 測試候選版

Companion for Tavern 0.6.108. Both behavior and resource packs require the matching Tavern 0.6.108 UUIDs. Exact public host source is pinned to 5a128ed353ea1198ea913796fac145275d56188a.

World Liquor's sole functional change from frozen 0.1.68 corrects the existing namespaced effect panel's formatting-prefix slice from %.12s to %.18s. The six formatting pairs occupy 18 UTF-8 bytes. The 480 explicit sibling-scope bindings remain intact. Packet contents, zero-duration transport, cache behavior, effect rules, textures, positions and native HUD roots remain unchanged.

A separate real-client diagnostic with the original zero-duration sender showed that the 18-byte prefix gate captures normal drink tokens, retains them across a foreign title and clears them after milk; the 12-byte gate failed. This isolates the prefix issue but does not certify the production World Liquor panel. The actual paired production candidate must still pass the parent's native gate.

All other gameplay, scripts, recipes, all 56 shaker descriptors, 14 shaker recipes, furniture and assets remain unchanged from frozen 0.1.68. BP/RP/module identity, paired dependencies and the guide protocol advance together. All owned pack and module UUIDs remain unchanged. The failed 0.6.107 / 0.1.68 source and archives, historical release fingerprints and published packages are preserved.

## Verification and release gates

- Exact baseline/package, prefix-only preservation, focused HUD checks and required paired-source CI follow this Git-first checkpoint
- Frozen 0.6.107 / 0.1.68 failed native active-effect icon visibility and single-press cup-placement gates and is not approved for release
- The 0.6.108 / 0.1.69 production HUD and interaction gates remain pending
- The separate Grilling 2.8.70 seasoning-bottle acceptance gate must also pass before release
- Saved-world migration, full-family admission, full Java parity and production readiness remain pending
- No release, live deployment, new BDS test or simulated player acceptance is claimed

The existing published 0.1.67 publication request stays unchanged until the parent authorizes the final exact pair after all required native gates.
