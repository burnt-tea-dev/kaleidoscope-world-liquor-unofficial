# One network-player jukebox insertion

Status: **source fixture ready; block-click input and BDS observation NOT_RUN**.
This is one standing, non-sneaking Survival player, one named custom disc and
one empty vanilla `minecraft:jukebox`. It does not add a gameplay release.

## Existing evidence is reused

[W194's 23 checks and W196's 25 metadata/save checks](JUKEBOX-REMOVAL.md)
cover their recorded native storage, ejection, replacement and restart paths.
W196 explicitly had no players and seeded storage through `planRecordStorage`;
the earlier simulated-player click did not deliver the required event. Neither
is an observed network-player acceptance/payment result. Later W201/T205
pairing does not change that scope. These checks are not rerun here.

The existing [source callback regressions](../tests/record-storage.test.mjs)
cover successful debit and payment/row-write rollback. This fixture prepares
only successful insertion/debit; it does not inject a payment failure or claim
that rollback has acquired new native evidence.

## Java expectation

The current author branches remain Forge 1.20.1/1.1.13 (CF9217901) and NeoForge
1.21.1/1.1.12 (CF9217896), matching the pinned archives in
[the author review](../data/current-author-review-20261028.json).

| Branch | Actual author caller and Minecraft owner | This Survival case |
| --- | --- | --- |
| Forge 1.20.1 | `ModItems` creates a native `RecordItem` with stack size 1. `RecordItem.useOn` accepts an empty jukebox, gives its block entity an ItemStack copy and shrinks the held stack by one. | Store the original stack data; the one-item hand becomes empty. |
| NeoForge 1.21.1 | `ModItems` creates an Item with stack size 1 and `jukeboxPlayable(RANDOM_DISC)`. `JukeboxBlock.useItemOn` delegates to `JukeboxPlayable.tryInsertIntoJukebox`, which consumes/returns one stack to the block entity. | The same acceptance, one-item debit and retained stack-data expectation. |

These are separate archive/official mapped-bytecode checks, not Java gameplay
observations. Bedrock name/lore/DP are this adapter's observable stack sample;
they are not a claim of identical Java NBT/component encoding.

## QA preparation and the input root must provide

Copy [the observer](../tests/native/record-network-click-probe.js) into the QA
copy's BP `scripts/` and select it as that copy's entrypoint. It imports the
unchanged production `main.js`. Use fixed W201 runtime
`dc6087712683fc5da7f3c2f445fe94d421be36ce` and its actual T205 dependency
`9f4c97826a8773039e14f46c58b2776de644ac5f`, selected BDS 1.26.60.6/server
2.12.0-beta and the existing creator/Beta settings. No GameTest/SimulatedPlayer
module, player override, replacement geometry or new gameplay predicate is needed.

The common owner prepares a small isolated QA with a solid flat floor and the
real network actor. Root's driver must finish initial loading before this step.
Do not borrow a stopped TACZ world or create a full-family/save-backup gate.

1. Connect exactly one named network player in Survival. Let it land on the
   overworld QA floor, not sneaking, with selected empty hotbar slot 0 and empty
   offhand. Then send from the **server console**:
   `/scriptevent record_click_qa:prepare {"player":"RecordClickQA"}`.
2. The fixture leaves the actor's position/rotation unchanged. At floor(player
   position)+(0,0,2), it requires air over a solid support and no existing owned
   storage, places one vanilla jukebox and seeds exactly one native disc in slot
   0. Name: `W201 network-click disc`; lore: `One real jukebox insertion`; string
   DP: `record_click_qa:serial=one-network-disc`. It never clears another item.
3. Read `RECORD_NETWORK_CLICK_QA_READY`. It supplies the actual target, block ID
   and states, head/feet, desired yaw/pitch, selected slot and native seeded item.
   Aim at the **north face center**, relative hit `(0.5,0.5,0)`. Distance from
   the actual head is checked at most 3 blocks. With feet `(0.5,81,0.5)`, the
   target is `(0,81,2)` and the world hit is `(0.5,81.5,2)`; use the actual READY
   values rather than this example's assumed eye height.
4. Root must receive the real server's inventory update and target block update,
   retain their actual wire item/network-stack identity and block runtime ID,
   and supply ordinary look plus **block-use NormalInventoryTransaction** input
   for that target/face/slot. `use_air` and `release` are not this operation.
   Packet encoding and the block-click driver change remain with root; this
   fixture does not implement, guess or bypass them.
5. After the input and at least two server ticks, send
   `/scriptevent record_click_qa:read`. Reading too early reports PENDING.
   A missing real block event cannot pass. After prepare, both event observation
   and read are read-only; there is no manual hand clearing or second gameplay
   action. Stop/remove the small QA through the existing common-owner tools.

## Real callback and observations

The production path is
`world.beforeEvents.playerInteractWithBlock` ->
[`installFurniture`](../runtime/BP/scripts/furniture.js) jukebox branch ->
its deferred accepted-hand check -> the same module's transaction/pay owner ->
[`planRecordStorage`](../runtime/BP/scripts/record-storage.js) -> native container.
The formal handler cancels the vanilla path and defers writes; therefore an
`afterEvents.playerInteractWithBlock` callback is not the required observation.

The observer neither cancels that event nor calls `deferPlayerUse`, transaction,
`planRecordStorage`, audio/eject functions or a simulated-player interaction.
Its imported storage functions only derive the authoritative read keys. It reads
the native index's actual carrier and `container.getItem` results, not a new
ItemStack reconstructed from `row.record`.

RESULT includes the real before-event hand/target/face/position, inventory before
and after, production row/index/carrier ID and all four actual native slots.
Pass requires one first event with the seeded hand, slot 0 empty afterwards,
all other inventory unchanged, an owned production carrier and the full sampled
disc in slot 0 with the other three slots empty. The before-event hand includes
type/count/name/raw lore/all public DP/keepOnDeath/lockMode, explicitly marked
`heldScope` as the before-safe fields. It does not read or invent placement data.
The seed and all native container slots are read in prepare/read's server script
event context, including actual `canDestroy` and `canPlaceOn`. The full native
stack comparison still requires both fields to match the original seed.

The selected 2.12-beta ItemStack API declares `getCanDestroy` and `getCanPlaceOn`
as unavailable in restricted execution. PR208's original before snapshot called
them anyway; an existing real network-food observation confirmed the getter
exception in that context. That history remains a source-fixture defect, not a
failed World Liquor click run or a new gameplay result. The follow-up separates
safe before fields from full prepare/read snapshots. No empty-value fallback,
timer, event imitation or weaker event/debit/storage requirement is added.

The script cannot identify network versus simulated provenance from `Player`
alone. Attach root's actual initialized-connection and received block-use trace
for the same actor to establish the network origin. READY or a script-only
RESULT alone is not a network-click proof. If root cannot yet deliver block-use,
keep NOT_RUN/absence of event; do not call an accept helper to obtain a positive.
No new audio/client, rollback, removal, death, dimension, orientation-matrix or
saved-world result is claimed.
