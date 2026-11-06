# Retail BDS mayfly / Education-world-profile capability probe

This is a QA-only pack in `tests/native/mayfly-education`. It imports no W/T
runtime, player definition or UI. It is not W201, a flight adapter, a new edition,
or permission to change LIVE. Use the existing isolated native runner, shared
flock, resource admission and cleanup; one blank world and one load only.

## Exact candidate

- Retail BDS **1.26.60.6**, ordinary Survival world, `@minecraft/server`
  **2.12.0-beta**, `@minecraft/server-gametest` **1.0.0-beta**.
- Keep the current narrow runner's Beta APIs (`gametest`) and Upcoming Creator
  Features flags. This probe does not try other engines or new experiment sets.
- The owner inspected an actual retail saved level.dat with the canonical NBT
  reader: `commandsEnabled` Byte 1, `cheatsEnabled` Byte 0, `eduOffer` Int 0,
  `educationFeaturesEnabled` Byte 0. Keep those known types and values in the
  blank QA seed, changing **only educationFeaturesEnabled to Byte 1**. No saved
  world or backup is copied or written. Retain the existing QA
  `server.properties` setting `allow-cheats=true`.
- This is an explicitly named candidate, not a claim that the fields equal the
  complete client Education UI configuration or activate an Education edition.
  Read all four fields back from the QA level.dat after normal stop, including
  actual NBT types. Do not silently adjust `eduOffer` or other flags on failure.

The [official Education command reference](https://edusupport.minecraft.net/hc/en-us/articles/360047555451-Essential-Commands)
documents ability/mayfly. The [official ordinary Bedrock guidance](https://edusupport.minecraft.net/hc/en-us/articles/360047556971-Learning-with-Minecraft-Bedrock-and-Java)
allows some Education features through world settings, but neither source
proves this exact retail BDS profile. The stable/experimental [Player API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-experimental)
has read-only isFlying; a GameTest helper is not a formal Player permission API.

## Single scene

With zero players, load the small area around `6 81 8` and put a stone floor
below it. After the fixture's READY marker, send
`scriptevent mayfly_education_qa:run`. Before that, the host runner logs console
`time add 1`, `help ability`, and `ability @a mayfly`. Console and Script API
contexts are separate observations: a rejected API command does not prove that
the native console lacks it.

The script first uses `time add 1` as a legal cheat/context control. It then
records help and an empty-selector ability query. Expected command errors are
data. If these reveal no accessible candidate, finish without spawning a
player. Do not report that as a failed flight input test.

If available, create only one native **Survival** simulated QA Player. Confirm
the self selector with `testfor @s`, then record initial queries and
`mayfly false → true → false`, including repeated false and true writes. Capture
the actual CommandResult own/prototype keys and readable fields, and complete
exceptions. A successCount is a command result count, **not a permission bool**;
identical writes must not be presumed to reveal an original grant.

Call the documented [SimulatedPlayer.fly](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer?view=minecraft-bedrock-experimental)
only after establishing the false baseline. Record mode/isFlying after native
ticks. If it flies without mayfly, the helper bypasses the tested permission:
skip the true input test, retain command observations, and claim no permission
proof. The helper reset after this negative control is labeled diagnostic.
Observe revocation before the final stopFlying/disconnect cleanup; cleanup is
never native-revocation evidence. Never set Creative mode or add flight forces.

## Decision and closeout

- A failed legal cheat control invalidates the command scene.
- Console/API ability errors, writable permission commands, readable original
  permission, and effective flight are distinct results. Preserve all of them.
- Unknown command closes only this profile/context. No inference about every
  BDS Education configuration, a dedicated Education product or future engine.
- Even successful grants do not establish a safe original-permission reader or
  ownership rule. Do not install an adapter that always revokes on expiry.
- Reuse the existing NBT reader after this one normal stop; keep field values,
  types, engine/modules/flags, source, full raw logs and cleanup evidence. Remove
  only the temporary QA engine/world under the existing idle/flock checks and
  return the slot immediately. No restart, migration or full-family cycle.
