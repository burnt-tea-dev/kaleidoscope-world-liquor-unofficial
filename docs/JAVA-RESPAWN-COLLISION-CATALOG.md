# 完整 Minecraft 1.21.1 source state 資料

`VanillaShapeCatalogOracle.java` 延伸原有 headless oracle，原先 `shape-samples.json`、
`VanillaShapeOracle.java` 與 33 個示範 state 保留。本次直接呼叫未修改官方 Mojang
JAR 的所有 1060 種方塊／26684 個 possible states，完整生成只執行一次，沒有重新
下載依賴或重跑 JAR／library hash。

- `vanilla-shape-catalog.json`：完整 compact source catalog，26505 個 static states、
  22 種 dynamic 方塊的 179 個 states、320 組去重 collision AABB、20 種 fluid states。
- `java-vanilla-block-catalog-1.21.1.js`：2,791,130 bytes 自有 generated 數值資料與精確
  key lookup helper，沒有導入任何 runtime。
- `CATALOG-RECEIPT.json`：來源、實際 source method、範圍、成本與界線。
- `catalog-counterexamples.json`：完整 26684 key round-trip 與 9 個具體反例。

Stable key 為 registry ID 加按名稱排序的 Java state properties，例如：
`minecraft:oak_slab[type=bottom,waterlogged=false]`。無 properties 的 state 只用
registry ID。`blocks` 另列 default key、properties domain、state 數量與 dynamic 標記。
缺少 properties、未知 properties／value 或未知 addon ID 不會默默套用預設 state。

每個 state packed row 是 `[collision_shape_index, flags, fluid_state_index]`。
`flag_bits` 指定 UP sturdy、玩家 block dangerous、CLIMBABLE、nonempty fluid、
MOTION_BLOCKING、isSolid、INVALID_SPAWN_INSIDE、blocksMotion、dynamic shape。
這些值分別來自官方原生 method 或已綁定 vanilla tags 的 state.is(tag)，沒有把
native raycast、selection boxes、方塊名稱推測或 Bedrock 不可用的 isSolid 當來源。
`MOTION_BLOCKING` 是直接呼叫官方 Heightmap predicate，並對每個 state 核對它與
原作 `blocksMotion || !fluid.isEmpty` 的一致性。

完整 source query errors=0。一次完整生成耗時 17.60 秒、peak resident 418392 KiB，
heap 上限 512 MiB；之後僅驗證 generated lookup 完整可查與必要反例，未重啟 Java
bootstrap 或原生 BDS。已確認 fence collision=1.5、carpet=.0625、cactus=.9375 且
dangerous、bottom slab=.5／UP sturdy=false、top slab UP sturdy=true、source water
collision 空但 nonempty fluid／MOTION_BLOCKING=true、ladder CLIMBABLE、end portal
INVALID_SPAWN_INSIDE、床=.5625。

## 精確查詢

```js
import {javaStaticStateFacts, javaDynamicStateObservation, JAVA_BLOCK_FLAGS}
 from './java-vanilla-block-catalog-1.21.1.js';
const bottom = javaStaticStateFacts('minecraft:oak_slab', {
 type: 'bottom', waterlogged: false
});
// bottom.collisionBoxes; bottom.flags; bottom.fluid
```

Dynamic shape observation 只由獨立 `javaDynamicStateObservation` 提供；static lookup
拒絕所有 dynamic states。179 個 dynamic state 資料來自原點、空周遭、無 block entity、
`CollisionContext.empty()`，因此只能視為這個 context 的觀察，不能當作實際世界的
固定碰撞形狀。Moving piston、各色 shulker box、bamboo、scaffolding、powder snow、
pointed dripstone 仍須個別實作其原作 block entity、座標 offset 或 context 邏輯。

資料限 vanilla 1.21.1 與內建 tags；完整 Bedrock projection 仍須把實際 ID／state
轉為 named Java properties，未知 mod／datapack class/tag 不在此數值 catalog 的聲稱
內。這份 export 不構成玩家 respawn、真人動作、不同維度／chunk 或畫面音效驗收。

## Source credit 與重跑

Mojang Studios / Minecraft 1.21.1。公開資料可使用自有 harness 與這些 source-derived
數值事實；不得把官方 client.jar、libraries 或第三方完整 implementation 放進公開 Git。
官方物件和 mappings 的來源 URL 已保存於 catalog.source，既有 library provenance
另保存在 `library-provenance.json`。

在本目錄執行：

```bash
javac -proc:none -cp 'libraries/*:.' -d . VanillaShapeCatalogOracle.java
java -Xmx512m -Djava.awt.headless=true \
 -cp '.:/root/senluo-baseline-20260930/full-java-parity-20261006/minecraft-1.21.1-client.jar:libraries/*' \
 org.senluo.oracle.VanillaShapeCatalogOracle \
 /root/senluo-baseline-20260930/full-java-parity-20261006/minecraft-1.21.1-client.jar \
 vanilla-shape-catalog.json
/root/senluo-baseline-20260930/venv/bin/python build_numeric_catalog.py
node check_numeric_catalog.mjs
```

同一來源與 unchanged catalog 不必為維持證據而重跑上述完整生成。

The committed data/harness and development/respawn catalog are source foundations only. No collision facts are silently applied to Bedrock blocks, and dynamic/unknown state mappings remain unimplemented. Jars, external libraries, worlds and machine-specific execution logs are not redistributed.

The committed executable checks are `node tools/respawn/check_numeric_catalog.mjs` and `node tests/respawn-source.test.mjs`. The self-written Java oracle sources are under tools/respawn; compile both with the official core libraries and supply the official 1.21.1 client JAR and output JSON as its two arguments. `python tools/respawn/build_numeric_catalog.py` lowers the committed source JSON into the development numeric catalog; it does not edit exported runtime or install anything.
