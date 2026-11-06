# Native custom block container / hopper capability probe

This is a standalone QA pack under `tests/native/block-hopper`, not W201 or a
cabinet repair. It imports no W/T runtime, carrier, player definition or UI. Use
one fresh isolated test world; no LIVE gameplay and no saved-world restart.
The host's existing native runner, shared flock, resource admission and cleanup
remain responsible for launching and removing the test engine.

Selected configuration: BDS **1.26.60.6**, `@minecraft/server` **2.12.0-beta**,
block format **1.26.60**, `minecraft:block_entity.container.slot_count: 2`.
Enable **Beta APIs** (`gametest`) and **Upcoming Creator Features**
(`upcoming_creator_features`) in this QA world's level.dat; retain the usual
`experiments_ever_used` and `saved_with_toggled_experiments` flags. Do not treat
a missing experiment, rejected definition or absent inventory component as a
successful negative hopper test.

The native container field and slot range are documented by the [official block
component reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_block_entity).
[Preview 26.50.26/27](https://feedback.minecraft.net/hc/en-us/articles/48228443785101-Minecraft-Beta-Preview-26-50-26-27)
added scripting access to these inventories. [Preview 26.70.23](https://www.minecraft.net/en-us/article/minecraft-preview-26-70-23)
later removes the Upcoming Creator Features requirement; it is not the selected
engine for this probe. No hopper/filter guarantee is inferred from those notes.

## Scene and observations

Load the fixture as the only selected world pack, load the area around
`6 81 16`, and provide a stone floor below it. With zero players, send
`scriptevent block_hopper_qa:run` after `BLOCK_HOPPER_QA_READY`.

Six independent lanes use ordinary native hoppers. For each of push, pull and
stacking, one lane uses a vanilla chest and the other the two-slot custom block.
Push uses an east-facing hopper beside its destination; pull uses a downward
hopper under the source. A redstone block locks each hopper during setup.
The script only seeds the source inventory. After removing the power it only
reads inventories at 8, 32, 80 and 160 ticks; **all transfer must be native**.

Push/pull use three glass bottles with a name, two lore lines, keepOnDeath and
canDestroy metadata already supported for that stack. Report the actual seed
and every observed source/destination slot. No unsupported dynamic property is
forced onto a stackable item. Stacking uses three ordinary cobblestone items;
observe whether a destination slot accumulates more than one.

## Decision

- Vanilla controls must transfer all seeded items with metadata preserved.
  Otherwise fix the scene before drawing a capability conclusion.
- A missing custom inventory is a component/configuration result, separate
  from a present inventory with no transfer in this 160-tick observation.
- Successful custom push/pull establishes this native transport on the exact
  engine and flags only. Loss or change of reported metadata is a separate
  failure, even if item counts move.
- `exceedsOnePerSlot: true` disproves an automatic per-slot limit of one for this
  ordinary container. The fixture does not declare a limit or an item filter.
- No result establishes Java bottle eligibility, irregular mutual exclusion,
  nine-slot cellar behavior, persistence/migration, or client interaction.
  Do not connect this fixture to formal storage until those rules have a proven
  native enforcement path.

Keep the raw `BLOCK_HOPPER_QA_RESULT` and engine logs, record the exact source,
engine/modules/experiments, and normally stop/clean up immediately. A completed
observation and a supported hopper capability are separate report fields.

## Observed on 2026-11-06

One load of the selected configuration above completed at 16:21 HKT using
probe source `8966df7e8d9afb3dba7fdd53909f1a50ede6c6d6`. The custom block loaded
as `hopper_capability:container`, exposed `minecraft:inventory`, and actually
had two slots. The saved experiment flags read back as enabled. This is a
native transfer observation, separate from the source-only Java contract.

| Lane | Native result after 160 ticks |
| --- | --- |
| Chest push | All 3 named bottles moved from hopper to chest; reported metadata preserved. |
| Chest pull | All 3 named bottles moved from chest to hopper; reported metadata preserved. |
| Chest stacking | All 3 cobblestone moved into one chest slot. |
| Custom push | All 3 named bottles remained in the hopper; custom inventory stayed empty. |
| Custom pull | All 3 seeded named bottles remained in custom slot 0; hopper stayed empty. |
| Custom stacking | All 3 cobblestone remained in the hopper; custom inventory stayed empty. |

The bottle checks include actual nameTag, lore, keepOnDeath, canDestroy,
canPlaceOn, maxAmount and the empty dynamic-property list reported by the
engine. They do not establish preservation of arbitrary unobserved metadata.
Snapshots at 8, 32, 80 and 160 ticks retain the custom-lane source contents;
the vanilla controls establish that the scene's hoppers did run.

The custom stacking destination never received anything. Its empty array and
`exceedsOnePerSlot: false` therefore **do not prove a per-slot limit of one**.
The custom pull source accepted the setup stack of 3 through Script, but that
is an initial seed, not a native hopper transfer or filter test.

This is a bounded negative for ordinary hopper push/pull on this BDS build,
fixture and flags. It is not evidence that every engine, Preview, transfer
direction or future native API is unsupported. No formal cabinet storage,
carrier flag, release identity or LIVE pack changed. There was no restart or
saved-world migration test. The zero-player engine stopped normally with exit
0 and no content errors/OOM; its temporary engine/world was removed after the
existing idle check, and the shared slot was returned immediately. Raw host
logs, snapshots and cleanup evidence remain in the owning host's existing
World Liquor progress record.
