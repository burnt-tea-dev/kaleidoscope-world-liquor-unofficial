# 唱片機取出與銷毀回收

W190銷毀修正：2026-11-05；W192手動取出修正：2026-11-06。範圍為原版唱片機中由World Liquor保存的自訂唱片，不含掛牆唱片。

## 原作與反例

對照Mojang官方Minecraft1.21.1的[server](https://piston-data.mojang.com/v1/objects/59353fb40c36d304f2035d51e7d6e6baa98dc05c/server.jar)及[官方名稱對照](https://piston-data.mojang.com/v1/objects/03f8985492bda0afc0898465341eb0acef35f570/server.txt)，下載依官方版本資料所列大小與SHA1核對。`JukeboxBlock.onRemove`（mapped82–89）在方塊類型改變時呼叫`JukeboxBlockEntity.popOutTheItem`（56–74）；後者在伺服器取得非空唱片、移除容器內容，再直接建立一個唱片ItemEntity。此路徑不查玩家模式或doTileDrops。這是容器內容，與唱片機方塊物品的掉落分開。

W189的玩家破壞回呼卻排除Creative，爆炸回呼則排除doTileDrops=false。兩者先刪除保存記錄後未掉出唱片。正式回呼測試先重現兩個Creative失敗及一個爆炸失敗；W190移除負責來源中的這兩個錯誤條件。

## 驗證與界線

新增`tests/jukebox-removal.test.mjs`執行實際註冊的玩家破壞回呼，涵蓋Survival／Creative與doTileDrops開／關，並驗證重複事件不重發。`tests/record-audio.test.mjs`執行實際爆炸回呼，驗證關閉方塊掉落仍歸還內容、清除自己的保存列並只停止自己的音訊。新回歸已加入既有package CI入口。

保存列格式與唱片ID不變；既有新／舊保存列讀取及相關音訊來源測試沿用。未重跑已有效且未受影響的原生場景，未把舊音訊／保存結果改標為W190破壞觀察。W190當時未處理的完整ItemStack metadata、原作掉落位置／速度／pickup delay、手動取出及自動化仍由[差距矩陣](PARITY-MATRIX.md)追蹤；本次沒有宣稱補全。完整家族與停服保存驗證、部署交共同持有人。

## W192：手動取出

同一官方Minecraft1.21.1的`JukeboxBlock.useItemOn`（66–77）在已有唱片時回傳`PASS_TO_DEFAULT_BLOCK_INTERACTION`，`useWithoutItem`（56–61）呼叫同一`popOutTheItem`，不讀背包。`ServerPlayerGameMode.useItemOn`（327–380）排除旁觀模式；蹲下且任一手持物時則跳過方塊互動。W191的正式回呼在空手時用Inventory.add歸還，持物時直接拒絕；滿背包、手持石頭點唱片機是實際可達的反例。

W192移除該唱片機背包歸還路徑，手動、拆除與爆炸皆呼叫`record-audio.ejectRecord`。輸出採block+(0.5,1.01,0.5)，再按原`Vec3.offsetRandom`（148）對三軸加入nextFloat與0.7f的位移；JVM常數獨立驗證其float數值。保存列在原生spawn成功後才消耗；最後寫入失敗時撤除暫時掉落，保存列保持可恢復。不新增存檔欄位。完整ItemStack metadata、初速與pickup delay仍未等價。

來源回歸先重現兩案失敗；現在直接執行正式互動回呼與真實音訊owner，覆蓋空手／持物滿包、Adventure／Creative／Spectator、蹲下主／副手、已接受手持物變更、重複事件、float落點與失敗回復。既有掛牆回歸使用同一真實音訊模組，不再以空函式代替它。

## 2026-11-06 原生觀察與 W193 配對

`tests/native/jukebox-eject-probe.js`已在隔離BDS1.26.60.6／server2.12-beta執行。最初插入沒有送出before事件；補上spawn後20tick等待及lookAtBlock後仍是`interactWithBlock=false`，保存列未產生。observer記錄API回值、玩家位置與視線，最後斷線。這個模擬輸入結果保持失敗，不是產品點擊已通過，也不繼續重試相同入口。

另一個明確分開的原生I/O觀察直接呼叫正式`record-audio.ejectRecord`，使用真Native唱片機、world dynamic property、掉落物及SimulatedPlayer背包。14項檢查通過：空包／滿包Survival與滿包Creative＋doTileDrops=false，均掉出一個世界唱片、消耗保存列且背包不變。這證明正式owner的原生讀寫，不證明原生點擊事件。正式互動回呼仍由W192的實作測試與canonical CI覆蓋。各觀察均正常stop／Quit correctly／engine exit0，errors空、playersAfter0；測試世界與引擎已清除，沒有進入LIVE。

W193最後一次精確配T202與G237，只改發布身份、依賴及本說明；W192玩法與嵌入SDK不變。完整家族保存驗證與部署由共同維護流程執行。完整ItemStack metadata、初速、pickup delay與未觀察的客戶端聲畫仍未等價。

## W194：指令／腳本替換方塊

同一官方Minecraft1.21.1的`JukeboxBlock.onRemove`只檢查新舊方塊類型是否相同；不同就呼叫`popOutTheItem`，不要求玩家破壞或爆炸事件。兩個維護作者archive沒有另行覆寫原版唱片機。W193的定時清理卻只停音與刪除保存列，指令`setblock ... air`或其他addon替換唱片機會吞掉保存唱片。同一位置若已有新家具資料，清理還會刪除那份新資料。兩個正式清理回呼案例在修正前均失敗。

現在清理讀取當前保存列：仍是自己的唱片機記錄才呼叫既有`ejectRecord`，不再直接刪除該位置的任意資料。新家具／牆掛唱片的資料保留。無法讀取區塊時保留唱片，掉落或停止失敗時沿用既有回復與重試；後續清理不重發。讀回舊保存列的新script instance亦覆蓋，沒有新欄位或保存格式。延遲仍沿既有10tick清理排程，並非Java的同步`onRemove`。

26個音訊來源案例通過，包括替換回收、保護新家具資料、舊列重載及暫時停止失敗後只回收一次。這些直接執行正式清理回呼，不冒充原生觀察。W192原生14項只重用未變`ejectRecord`的原生I/O範圍，不改標為本次替換入口通過。

窄原生fixture在[`jukebox-replacement-probe.js`](../tests/native/jukebox-replacement-probe.js)。共同持有人在無玩家的隔離QA包用它覆蓋entrypoint，放到scripts目錄並保留正式`record-audio.js`／`combat-source.js`；使用BDS1.26.60.6及server2.12.0-beta，沿原包所需實驗，不需GameTest或模擬玩家。提供空的整數座標及下方足夠寬的石地，以`/scriptevent jukebox_qa:replacement {"x":8,"y":81,"z":8}`執行；第一輪觀察原生`Block.setType`替換與新資料保留，並留下待保存唱片。正常停止、同一世界重啟後送相同事件，觀察啟動讀回的唱片能掉回一次。保留兩個`JUKEBOX_REPLACEMENT_QA_RESULT`、正常停止及清理結果；此fixture尚未執行，不重試已失敗的SimulatedPlayer點擊，也不重跑既有音訊／水面矩陣。
