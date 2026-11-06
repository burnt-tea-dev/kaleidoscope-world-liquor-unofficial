# Respawn：Java 1.21.1 resolver 與 Native adapter

真正的 `effects.js` Player Respawn入口已接到原作resolver。W198另修合法ready路徑的原生Player傳送拒絕與失敗扣錨：使用正常Player teleport參數，若傳送拋錯就恢復剛扣的原生anchor permutation。新Player效果／落地及同QA兩錨重啟共23項原生檢查通過，範圍見下節；不是完整Java或client還原聲明。

## 來源

當前兩個作者分支、實際呼叫／相對旗標與client清速度依據只維護在[Java來源與傳送](JAVA-RESPAWN-SOURCE-20261007.md)。1.21.1仍是本resolver的選定來源，其他Minecraft／Forge fallback不混用；歷史數值fixtures保留原範圍。

原生規則取自未修改的 [Mojang 1.21.1 client JAR](https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar) 與[官方 mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt)。公開 runtime 放數值事實和本專案實作，沒有放 JAR 或第三方完整程式。

| 原生方法 | 對應名稱及已使用證據 |
| --- | --- |
| ServerPlayer.findRespawnPositionAndUseSpawnBlock | 床／錨／forced／Overworld fallback，成功錨扣除時機，床／錨看向來源點的 yaw |
| BedBlock.findStandUpPosition | savedYaw 決定側邊順序；普通床 strict 12→non-strict 12；上下床階段完整保留 |
| RespawnAnchorBlock.findStandUpPosition | N/W/S/E/NW/NE/SW/SE 的 0/−1/+1 高度層，再正上方；strict 全部→non-strict 全部 |
| DismountHelper.findSafeDismountLocation | danger→non-climbable floor→必要 lower danger→僅 block collision→INVALID_SPAWN_INSIDE→border AABB |
| Cursor3D.advance / BlockCollisions.computeNext | X 最快、再 Y、再 Z；三邊界略過，兩邊界只 moving piston，一邊界要求 hasLargeCollisionShape |
| PlayerRespawnLogic.getOverworldRespawnPos | source MOTION_BLOCKING／WORLD_SURFACE／OCEAN_FLOOR；從 motion+1 往下，先流體再完整上表面 |
| CollisionGetter.noCollision / EntityGetter.getEntityCollisions | default 分支 blocks→entities→border；實體 broadphase 膨脹 1e−7 |
| WorldBorder constructor / StaticBorderExtent | 中心 0/0、大小 59999968、absolute max 29999984；每一條邊雙側 clamp；碰撞外牆用 floor(min)/ceil(max) |
| WorldBorder.isWithinBounds(AABB) | min inclusive、max exclusive；測 max corner 前減 9.999999747378752e−6 |
| GameType static initializer | DEFAULT_MODE 直接指定 SURVIVAL；不是 Native 當前玩家模式 |

`respawn-adapter.js` 前半保留已審查的 numeric／candidate 核心；`respawn-blocks.js` 前半使用既有 1060 source blocks、26684 states 的數值 catalog。原始 immutable development oracle 和 data 沒有更動，也沒有新增一套 hash 真相。

## 可直接運作的路徑

只安裝這個移植與必要 Tavern 相依時，port-owned Java context 預設就可使用，不要求伺服器注入 callback。

- Nether 有電量的錨、keepInventory=true：不用歷史 forced 或 yaw，採完整 source candidate／floor／body／border，朝向由目標與錨位置算出，不扣錨。
- keepInventory=false 的錨：candidate 成功之後才讀實際 forced；已知 nonforced 扣一格再傳送，unknown 不偷扣或猜值。
- 床：使用確認過或明確宣告的 savedYaw；沒有 yaw 時只接受兩種 source 側邊順序結果完全相同的情況。沒有將床朝向或玩家當前角度當成 savedYaw。
- forced：使用已知 flag／yaw 和 source `Block.isPossibleToRespawnInThis`，不加原作沒有的地板／半徑搜尋。個人點是已知不可 forced 的實心方塊時，兩種 forced 值都拒絕，可直接進 default 而不虛構旗標。
- default：完整 source radius/count/step 與 heightmap column 路徑；Native default Y=32767 的一般陸地可以經有效 column 得到正確地面高度。只有真的需要 fallback 原點 Y 時，這個 sentinel 才是 unknown。

任何實際查詢不能確定的事實保留 `unknown`，不當成 `null`，也不跳過它繼續挑另一個候選。起點音效後 quiet return，沒有反覆文字欄位、聊天或 actionbar 提示。

## 明確擁有的來源 context

`JAVA_RESPAWN_DEFAULT_CONTEXT` 是這個移植持有的 Java 邏輯 context。WorldBorder constructor 與 GameType.DEFAULT_MODE 是它的來源。它**沒有讀取或修改 Native 世界邊界**，也沒有宣稱 Native 客戶端會畫出 Java 邊界牆；其他 addon 的邊界不會自動視為已納入。

`declareJavaRespawnContext(world, {schema:1, border:{centerX,centerZ,size,absoluteMax}, adventure})` 可保存本移植明確宣告的 profile。數字、schema、大小／absolute max 與 boolean 會驗證，壞資料不能靜默落回默认。預設沒有寫入任何 Native worldborder／遊戲模式設定。

其他 pack 有兩個實際公開入口，從 `effects.js` 的 installer 註冊一次，而不是要求跨 pack import module。使用 stable `system.sendScriptEvent(id, JSON.stringify(payload))`；只接受 `Server` source，不能帶 sourceEntity／sourceBlock／initiator。JSON 至多 4096 個字元，欄位必須在下面 schema 內；不執行字串程式，不接受 extra fields。拒絕資料時保留已宣告 context，不發 HUD／聊天或反覆 log。

| Script event ID | Payload |
| --- | --- |
| `kaleidoscope_world_liquor:declare_respawn_context` | `{schema:1,border:{centerX,centerZ,size,absoluteMax},adventure}`；儲存 owned logical source context |
| `kaleidoscope_world_liquor:declare_respawn_metadata` | `{entity,point:{x,y,z,dimensionId},yaw,forced}`；entity 必須解析成真正 Player，point 必須完全等於他目前 Native getSpawnPoint；Java int32／可表示 float yaw／boolean 驗證後存入本移植 |

例如 ported border addon 可送 profile 的來源中心／大小，旧床點整合可送已知 source savedYaw／forced。這兩個事件沒有提供跨 pack executable callback，也沒有讓不同 Native 點冒充 Java 個人點。下面的 block／entity／dimension callback providers 是**同包內部介面**；更完整的跨 pack source geometry protocol 尚未實作，不能宣稱所有未知 addon 幾何都已相容。

`setJavaRespawnContextProvider(fn)` 供 ported addon 明確接入。provider 收 `{player,world}`，可按需要提供：

| 欄位／callback | 所宣告的 source 事實 |
| --- | --- |
| profile | 本移植採用的 source border／server Adventure profile |
| personalSpawn(player), metadata(player,spawn) | source BlockPos／dimension；source savedYaw／forced |
| sharedSpawn(world), nextInt(bound) | source shared BlockPos（含真正 Y）；source RNG bound 內的值 |
| dimensionFeatures(dimension), generatorSpawnHeight(dimension) | custom dimension 的 bed/anchor/skylight/ceiling/minY/maxY 與 ceiling generator 高度 |
| blockState(block,dimension,at) | source block ID／已知 property constraints，不能只塞未知形狀為 full cube |
| blockFact({method,block,view,dimension,at}) | source empty-context collisionBoxes／non-climbable floorMaximum／largeCollision；callback undefined 才回原有事實 |
| playerBounds(player,position), playerCollisionBoxes(context) | default source 當前 Player 形狀與 dynamic block 的 living context 形狀 |
| entityFact(entity,context), entityCollision(player,dimension,bounds) | source 可碰撞旗標、source bounds、source rootVehicleId，或完整原生 noCollision 的 entity 判定 |

Native permutation 與 Java properties 的已知對應逐欄限制可能 states，再對**當次詢問的事實**求一致答案。未知水深若不改變 empty collision／danger／nonempty fluid，就不阻止這些查詢。未知 slab half 若會改變 floor，仍是 unknown。代表白床僅使用所有顏色一致的來源碰撞與類別事實，沒有改變物品／世界方塊顏色。

實體判定只列官方 Native 同名且 Java `canBeCollidedWith=false` 的 97 個 counterparts；有實際 `minecraft:item` component 的掉落物另有明確映射。牛、玩家及普通 minecart 等不會因出現在遠處而阻擋 default。Boat／ChestBoat 的 bounds 由來源固定 1.375F×.5625F 算，共乘樹用穩定 Native riding relation 對應；不讀 Native getAABB。Shulker 先用 source scale≤3／physicalPeek 0..1 的所有可能 bounds 證明遠處不相關，重疊時缺少 peek/alive/vehicle 資料仍要求 provider，沒有把 union 本身當成碰撞。未知 addon 類別需宣告 source bounds／排除事實，無法用名稱或健康值猜它的 Java class。

## W198正式Player傳送與失敗回復

修前兩個來源反例直接執行`effects.js applyEffect → safeRespawn → applyJavaRespawn`：合法ready路徑遇到已原生確認的Player keepVelocity拒絕；另一個傳送例外使anchor charge2→1而玩家未移動。immutable原生permutation的來源fixture現在能觀察扣次及回復，不只記錄setter呼叫。來源回歸驗證正常參數與傳送失敗後charge恢復2、原錯重拋，且沒有目的地音效或Hunger；其他既有resolver／metadata／family案例沿實際受影響範圍通過。

[原生probe](../tests/native/respawn-player-probe.js)在官方BDS1.26.60.6／server2.12.0-beta、QA gametest1.0.0-beta、原實驗與完整W198＋固定T203上執行。first18／同QA restart5通過，[實際樣本](evidence/respawn-player-20261106.json)保留相對tick：

- 正常Player傳送前Y速度約−0.9054、XZ非零、原生falling=true；傳送後位置正確、XYZ速度0／falling=false，後兩tick也為0。之後真落地只受1點新fall傷害；未重跑的原Player控制為7點，沒有取消hurt、改血量或手算fallDistance。
- 正式applyEffect在合法declared anchor context中完成同維度keepInventory=true不扣次、跨維度keepInventory=false扣一次；目的地、Hunger300／amp0及血量20保留。跨維度同tick getter仍顯示先前速度，下1／2tick才全0；不冒稱所有維度的即時getter時序相同。
- 同一世界正常stop後restart，兩個真Nether anchor的charge2／1仍在。兩次engine exit0／Quit correctly、players0、內容errors[]／OOM0；自己的QA世界／包／引擎連結已清，時段歸還。

傳送例外回復是正式來源故障測試；本輪Native成功路徑沒有注入失敗傳送。QA直接呼叫正式Player效果入口，沒有真人喝酒或客戶端；音效保持來源呼叫／參數／成功順序並被API接受，不等於聽感與封包時序已驗。完整家族保存／部署仍交共同流程。

## 平台缺口與客戶端對照

| 狀況 | 保留的限制 |
| --- | --- |
| 舊世界床 yaw／command forced | stable [Player.getSpawnPoint](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable#getspawnpoint) 只提供 DimensionLocation；歷史內容不能重建 |
| 新床 metadata | 互動前捕獲 yaw，後續 actual point-change 或真正 sleep transition 才確認；同點含糊拒絕不寫新yaw，若舊yaw不同／forced=true則invalidate（Java在day/monster檢查前已可能更新）；相同yaw且nonforced兩種來源結果一致可保留，alreadySleeping來源earlyreturn保留；取消不寫，同點external overwrite需declaration contract |
| Native 個人 point 原點 | 是否直接等於 Java 床／錨 BlockPos，仍要真人客戶端測試；原型不 floor 半格、不偷改成下方方塊 |
| Native default dynamic Y | [World.getDefaultSpawnLocation](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable#getdefaultspawnlocation) 32767 只有動態高度語義；source column 失敗後不假造 sharedSpawnY |
| 未載入 source chunks／維度高度差 | getBlock 不可用就 unknown；不宣稱 Native 缺塊等於 Java 空氣，Vanilla Nether/End source build height 與 Native 可讀範圍可能不同 |
| dynamic shapes | Dismount EMPTY context 的 powder snow／scaffolding 具有確定來源；default living context 不套用 EMPTY 觀測。Bamboo/dripstone offsets、piston progress、shulker block entity 要 source facts/provider |
| source pose／實體 bounds | default ordinary Native standing 由穩定 flags 對應；非站立或自訂來源幾何需 provider。Native crouching/crawling/scale 與 Java pose 尚未完整真人驗證 |
| Native RNG | 預設 Native Math.random 均勻索引，沒有和 Java world RandomSource 共用種子／序列；source traversal及 draw 次數保留，跨平台相同随机世界序列仍未實現 |
| fallDistance／封包 | W198移除Player不支援的keepVelocity；Java client的原absolute XYZ packet會清XYZ速度，不能把server暫存delta誤當保速要求。正常原生teleport的Player前後／下2tick與真落地已在上節通過；無clearVelocity／補力或假fallDistance，實際client封包階段仍未驗證 |
| 音效／畫面 | 使用原作已收錄的 chorus fruit 樣本與 source volume/pitch/order；client 順序、畫面與真人移動不因純 JS fixture 通過就算驗收 |

真人對照場景：Nether 相同位置有電量錨＋keepInventory=true，喝 Respawn 酒；比較第一 North 落點、看向錨的方向、起點／終點音效與 Hunger。再 keepInventory=false 重新建立已宣告的 nonforced 點，確認只扣一次電量。Overworld 床朝北，分別以 +90/−90 設點後轉身喝酒，應採不同 source 第一側；舊床點沒有 metadata 時要保留 unknown。最後新世界 default spawn radius=0 的普通石地與有水表面，分別確認 column 成功與 sentinel fallback 未假造。

本批 focused 測試涵蓋實際 production Respawn branch、來源順序、unknown 停止、錨扣除、default sentinel／heightmap、saved bed yaw、source facts consensus、border兩種語義、來源實體 bounds／root vehicle與 Cursor3D。它們是 API-shaped JS 回歸，不是模擬玩家或真人 Native 驗收。BDS1.26.51.1另有4個真正Native block／numeric core觀測：stone、soul sand、Nether charged anchor第一North候選與yaw、Native床direction/head；normal exit／errors=[]且三個prototype modules未改。公開資料在 `data/java-parity/minecraft-1.21.1/native-respawn-blocks.json`，owned測試overlay入口在 `tests/native/respawn-block-probe.js`；它要在獨立測試包放上相同三個module，不能裝進live。該觀測沒有玩家，不是getSpawnPoint／actual Respawn callback或client驗收。第一次harness路徑錯誤沒有觀測，沒有算成通過。
