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

窄原生observer在`tests/native/jukebox-eject-probe.js`，尚未執行。僅供共同持有人在隔離QA的同一正式來源包中加test-only import、QA manifest加gametest1.0.0-beta，沿既有BDS1.26.60.6/server2.12-beta與實驗旗標。先準備無玩家、載入完成的空區域，唱片機位置與X+3位置下方須有實心地板；呼叫`/scriptevent jukebox_qa:eject {"x":40,"y":81,"z":0}`。它透過SimulatedPlayer實際插入／點擊，核對事件、保存列、掉落及背包，最後斷線。若模擬入口未送事件，保留失敗和平台限制，不可直接呼叫產品函式冒充原生輸入通過。不得加入LIVE或自行啟動BDS。

本批P131固定T201/G234/W191的來源不切換；W192交共同持有人後續選入與排程。
