# Native owner-bound mayfly predicate capability probe

PR205 established accessible mayfly commands in one retail BDS profile, while
Script CommandResult did not expose a permission bool and the fly helper did
not validate permission. This is a **different native readback candidate**. It
does not replay query counts, flight input, restart or a saved-world cycle.

## Native contract and minimal scene

The official [has_ability filter](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/filters/has_ability?view=minecraft-bedrock-stable)
includes mayfly and subject other. The [entity_sensor](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_entity_sensor?view=minecraft-bedrock-stable)
can filter nearby Players and fire native events. [is_owner](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/filters/is_owner?view=minecraft-bedrock-stable)
tests whether the subject owns the calling helper. The [tameable Script API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytameablecomponent?view=minecraft-bedrock-stable)
can natively tame an owned helper to an exact Player and read back that owner.
[Native entity events can set helper properties](https://learn.microsoft.com/en-us/minecraft/creator/documents/introductiontoentityproperties?view=minecraft-bedrock-stable).

```text
Native Player A owns helper HA; Native Player B owns helper HB
  both Players remain inside both helpers' sensor ranges
  entity_sensor: is_owner(other) AND has_ability(other, mayfly)
    native event writes this helper's mayfly property to 0 or 1
      Script reads the property; it never writes the output
```

Each helper starts at mayfly=-1 (unknown), with owner_seen=false. An independent
native is_owner sensor event sets owner_seen=true. A missing delivery therefore
cannot silently become false. Native true and inverted mayfly predicates set
the integer output through separate events.

Use two helpers at the same location, natively tamed to different Players.
Check tame's return, isTamed, tamedToPlayerId and resolved owner against the
actual Player IDs. No nearest-Player, name or dynamic-property ownership bridge.
The native tame event adds the standard is_tamed helper component.

1. Set A mayfly=false, B=true. Both remain Survival and inside both ranges.
   HA must report 0, HB 1 despite the nearby non-owner's opposite permission.
2. Keep both helpers and owner bindings. Reverse A=true, B=false. HA must
   report 1 and HB 0, establishing a fresh transition rather than a stale read.
3. Read native properties and positions at 5, 10, 20 and 30 ticks per phase.
   The final two samples must agree; retain earlier pending values. Owner event
   delivery, range/mode controls and ability matching are separate report fields.
4. Revoke only the two QA Players, remove the two QA helpers and disconnect.
   Record zero remaining Players/helpers before normal stop and host cleanup.

## Fixed profile and limits

Standalone pack: `tests/native/owner-mayfly-reader`. Retail BDS **1.26.60.6**,
server **2.12.0-beta**, gametest **1.0.0-beta**, the existing Beta/creator flags,
and the PR205 profile: commandsEnabled Byte 1, cheatsEnabled Byte 0,
eduOffer Int 0, educationFeaturesEnabled Byte 1. Allow two QA Players, load the
small area around `6 81 8` with a stone floor, then issue
`scriptevent owner_mayfly_qa:run` after `OWNER_MAYFLY_QA_READY`.

Only the established setter is used to provide the four known input states.
The getter is the native predicate/event/property path. Script does not set
helper output properties or manually trigger the result events. There are no
Player definitions, flight helpers, forces, formal registry, W/T runtime imports
or production package changes. Keep the ordinary engine/edition and only this
single world profile; do not widen to Preview or guess more toggles.

Success would establish a bounded owner-specific readback primitive on this
engine/profile. It would not implement Creative Flight or establish original
grant ownership, logout/rejoin, expiration, disconnected-owner handling, save
migration or client input. Owner/filter/API/event failures must remain distinct;
an unread property is unknown, not permission false. Use the existing narrow
runner/resource/shared-lock/NBT-readback/cleanup path; return the slot immediately
after normal stop. Do not replay PR205 or rewrite its original observations.

## Fixture correction

The first run of source `2e16af1166a9358c55e053cbaf8dc218b71500dc` observed both
owner-specific value transitions and positive ownership controls, but BDS
1.26.60.6 logged a tame_event JSON schema error for the documented string
shorthand. That run is retained and is not a clean pass. The fixture now uses
the official sample's full `{event, target}` actor-definition-trigger object.
Only this changed QA fixture needs another native observation; PR205 and other
successful tests remain unchanged and are not replayed.
