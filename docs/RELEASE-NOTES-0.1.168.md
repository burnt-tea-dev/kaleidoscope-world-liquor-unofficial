# 0.1.168 — independent record playback instances

The script jukebox adapter used a finite bank of 32 copies of the same sound event. When all aliases were occupied, insertion failed with `All 32 custom record audio channels are occupied`. Stopping playback issued a player-wide `stopsound` for the allocated event name. W168 replaces that bank with the engine's `SoundInstance` returned by each `Dimension.playSound` call. Ejection, replacement and cleanup stop the owned instance. There is no alias allocation, world property scan during insertion, or global stop command. The 32 duplicate resource definitions are removed.

Both packs keep their UUIDs and require Tavern 0.6.187. The source-check peers are canonical Tavern `4f651f1cf9e960252e378a94b6996b72b67d0b03` and optional Grilling `f7911448480dd1f3937a6319a581ca30d8fbba74`. World Liquor now declares `@minecraft/server` **2.10.0**; Bedrock's existing minimum engine declaration remains 1.26.50. The tested target is **BDS 1.26.52.3**. This implementation needs no experiment flag. Experimental capabilities remain permitted when declared and verified; the bridge project guard no longer rejects every nonempty experiment declaration.

## Playback and saved state

The original two streamed OGG files, equal selection weights, record category and range configuration are preserved. Playback uses `isBroadcast: true` and an individual engine handle. The selected Java song declares **2,920 seconds**. The existing ten-tick cleanup loop now retires an instance after that many simulation ticks, including while its block is unloaded; cleanup can occur up to nine ticks after the boundary. This does not simulate audio playback while the server is offline.

The existing saved-disc format is retained. Legacy `recordSound` alias metadata stays readable and is ignored for playback; new insertions do not write it. Restart keeps the stored disc retrievable and does not automatically replay it. Wall decorations share the property prefix but never own jukebox audio. Expiry stops playback without deleting the disc, and unloaded or malformed state is not silently discarded. The furniture transaction, hand validation, retrieval and wall identity rules remain the existing owners.

The old record-script and sound-registry historical hash projections are retired. Current production callback tests and original Java resource contracts now validate the affected audio domain. Release identities and append-only runtime fingerprints remain separate checks.

## Why this release does not ship native custom records

The [official 26.30 creator update](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.30?view=minecraft-bedrock-stable) documents custom sound strings for `minecraft:record` with Beta APIs. The [official beta schema](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/metadata/json_schemas/server/item/beta/minecraft_record%20(beta).json) also permits a sound-event string. However, the tested **1.26.52.3** binary still binds the field to the `LevelSoundEvent` enum.

A separate minimal fixture uses the supported `@minecraft/server` **2.11.0-beta**, `gametest` and `upcoming_creator_features`. All three custom item formats—1.26.30, 1.26.40 and 1.26.50—produce the enum parser error and fail native `setRecord` with `Item is not a record`. The otherwise equivalent **`record.cat` positive control is accepted and stored**. The fixture's resource pack defines the exact custom sound event and includes both original audio files. The result is a target-engine compatibility finding, not a ban on test APIs or a prediction about later engines.

Generate the small diagnostic with:

```sh
python tools/fixtures/record-capability.py --output /tmp/record-capability-fixture
```

Import its BP/RP into a **new disposable world**, enable Beta APIs and Upcoming Creator Features, and retain ContentLog plus `RECORD_CAPABILITY_DONE`. The diagnostic packs and script are outside release runtime. The bridge editor's Beta APIs declaration uses the historical ID `enableGameTestFramework`, confirmed in [its current package definition](https://github.com/bridge-core/editor-packages/blob/10e360dc24194651b814994467ebdb8f0403c62e/packages/minecraftBedrock/experimentalGameplay.json); a project declaration alone does not change an existing world's experiment flags.

Native custom-record migration, comparator output, hopper integration and full native ItemStack lifecycle remain open. The rejected native prototype is not included in W168. The implemented replacement relies on the documented stable [SoundInstance](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/soundinstance?view=minecraft-bedrock-stable) and [WorldSoundOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldsoundoptions?view=minecraft-bedrock-stable) capabilities that the actual target engine accepted.

## Current Java authority

The current official archives were downloaded again, rather than treating an earlier failed download as missing evidence:

| Branch | Official file | Relevant source |
|---|---|---|
| NeoForge 1.21.1 / 1.1.12, selected gameplay authority | [CF9217896](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896) | `jukebox_song/random_disc.json`: duration 2920, comparator **5** |
| Forge 1.20.1 / 1.1.13, compared separately | [CF9217901](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217901) | `ModItems` constructs `RecordItem` with comparator **6**, duration 2920 |

The NeoForge archive SHA-256 is `d963089ad0a7f99a8950171d76913cfeea99a0126ee12b16c72c3162f8545da3`; its song JSON SHA-256 is `06170f18eb501e5641a443e05c2d0fc09caa62fba7731cc84089bd2296ea995a`. The Forge archive SHA-256 is `793f746624a5d9d4a4c50b9ca7d2a756a4aeb91f092f0a1920e98d8fc988898c`. Both archives contain the same two audio files as runtime: `custom_music_1.ogg` SHA-256 `63412411f058ec5626a40bb1dd01929c776e2ac516055a97093743078f5ceb46` and `custom_music_2.ogg` SHA-256 `044adbda766abc3dca9d1d807e3df565cd285520b582ec1f8a0ffe3c1a29c185`. These byte matches establish asset provenance, not identical client mixing or spatial playback.

## Verification and limits

The [dated evidence](evidence/record-instances-20261027.json) binds the target binary, actual source files, fixture, native result and raw-log hashes. An isolated T187/W168 world with **no experiment flags** accepted 40 distinct handles through the production audio module, per-instance stop calls and removed-jukebox cleanup. The same saved world's restart preserved three explicit rows byte for byte: legacy jukebox, current jukebox and wall decoration. No managed world was read. The local file-descriptor warning and two existing unused Tavern component warnings remain recorded.

The current audio suite covers original assets, more than 32 simultaneous playback owners, same-event isolation, replacement, legacy rows, reload, wall ownership, unload, duration expiry, explosion drops and injected API failures. Existing wall transaction tests remain in place. These are callback/resource tests and bounded native API/persistence evidence. Audible mixing, actual client entering/leaving/reconnecting, random-track distribution, native Player operations, complete-family admission and full Java equality remain separate. `client=false`, `production_ready=false`, `pending_client_acceptance`.
