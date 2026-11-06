# Highball Creative Flight grant contract

Status on 2026-11-06: **not implemented in the released runtime**. W201 only
pairs the unchanged W200 gameplay with Tavern 0.6.205. It does not include the
unfinished flight prototype.

The selected expiry rule follows the maintained NeoForge 1.21.1 author branch:
remove only the drink's own flight grant and preserve independent grants,
including ones added while the drink is active. The Forge 1.20.1 marker-based
revocation rule is a different behavior and is not the selected adaptation.

## Established capability and remaining gap

The [owner-bound Native predicate](NATIVE-OWNER-MAYFLY-READER.md#observed-on-2026-11-06)
reads a particular Player's current mayfly value in the tested retail BDS
1.26.60.6 profile. Its owner binding identifies **which Player** is being read,
not **who granted** the permission. The [command probe](NATIVE-MAYFLY-EDUCATION.md)
also retains its original limits; neither probe establishes grant ownership.

Two Survival histories require different expiry results:

| History | Permission observations | Required after expiry |
| --- | --- | --- |
| Starts false; the drink grants true | false, then true | false |
| Starts false; the drink grants true; another source also grants true | false, then true | true |

The real unfinished controller was exercised with these API-boundary fixtures.
Its observed calls and values were identical for both histories. Leaving true
fails the first case; unconditionally clearing it fails the second. This is a
source counterexample, not a Native overlapping-grant or reconnect result.
Common prototype tests cover grant, rollback, pre-existing permission and
native-mode cleanup through injected SDK/Native boundaries. They do not prove
the complete Tavern publisher-to-W gameplay or saved-player lifecycle.

## Selected-engine interface finding

The exact official type package
[`@minecraft/server@2.12.0-beta.1.26.60-stable`](https://registry.npmjs.org/@minecraft/server/2.12.0-beta.1.26.60-stable)
was checked read-only. Player, Entity/component maps, attribute and definition
modifiers, input permissions, World/System events and EffectTypes expose no
independently removable Player flight grant or ability-writer event.

- [has_ability](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/filters/has_ability?view=minecraft-bedrock-stable) tests whether an ability is present; it has no grant-source selector.
- [ability](https://edusupport.minecraft.net/hc/en-us/articles/360047555451-Essential-Commands) sets a target ability true/false, without an owned-grant token.
- [PlayerInputPermissions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinputpermissions?view=minecraft-bedrock-experimental) enables or disables input categories, without a grant-source parameter.
- [can_fly](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycanflycomponent?view=minecraft-bedrock-stable) describes mob pathfinding. [input_air_controlled](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_input_air_controlled?view=minecraft-bedrock-stable) controls a ridden entity. Neither documents independent Player flight grants.

This bounds the finding to the checked public interfaces and selected engine;
it does not rule out future or undocumented Native capabilities. A supported
independently owned grant/removal operation, or equivalent sufficient Native
source information, is still needed. An old snapshot, faster polling, another
timer or a forced-flight loop does not distinguish the histories above.

T205's recipient-session publisher repair is independently complete. It fixes
initial snapshots after lifecycle changes and does not supply grant ownership.
No new Native test or full flight claim accompanies this dependency pairing.
