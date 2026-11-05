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

窄原生fixture在[`jukebox-replacement-probe.js`](../tests/native/jukebox-replacement-probe.js)。使用完整W194與固定T202配套的隔離QA包：把fixture放進scripts目錄，僅在QA manifest將entrypoint指向它。它先import未修改的正式`main.js`，沿startup註冊真方塊元件，再由正式worldLoad→installFurniture→installRecordCleanup註冊10tick清理；沒有測試版cleanup、假world或直接呼叫清理。BDS1.26.60.6／server2.12.0-beta沿原包實驗，不需GameTest或模擬玩家。

提供兩個空位：事件指定位置與X+4，兩者下方均有足夠寬的石地且保持chunk載入。以`/scriptevent jukebox_qa:replacement {"x":8,"y":81,"z":8}`開始。第一位置由QA寫入真world保存列與啟用正式播放，再用原生`Block.setType`換成空氣；等待正式定時回呼讀列、原生spawnItem並清列，之後再等一次以排除重發。第二位置也從有音訊的唱片機換成真冰櫃，透過正式`planFreezerStorage`建立原生四槽carrier，放入帶名稱、raw lore、dynamic property與damage的劍；觀察清理沒有刪其機器列／carrier索引，且`readFreezerItems`能取回同一原生物品資料。QAproducer不是完整玩家插入入口，沒有把它宣稱為自然點擊。

第一輪成功後保留原位置的待保存唱片及第二位置的非空冰櫃。正常停止、同一世界重啟，送相同事件：先確認冰櫃／索引／原carrier ID與物品metadata，再替換啟動讀回的唱片機並觀察一次世界掉落，最後再次核對冰櫃，經正式storage mutation清除自己的QA carrier。原版fixture的「石頭＋QA字串」只驗raw world DP保留，已由這個實際家具／物品場景取代，不能引用為真冰櫃結果。

保留兩個`JUKEBOX_REPLACEMENT_QA_RESULT`的checks／observations、同QA世界身份、正常停止、players／content errors／OOM及清理結果。不重試已失敗的SimulatedPlayer點擊，也不重跑既有Jukebox14 I/O、冰櫃全矩陣或水面。W194 runtime、發布身份及peer pins不因QA／說明補強而再改。

## W194 原生替換與保存結果（2026-11-06）

已在官方BDS1.26.60.6完成first11項／同QA世界restart12項。QA來源為PR193 `ebf734c50734f40b6c21524cabbde6714fe9b884`，W194 runtime與PR192 `f2964c7ff430208c951c0a7b711709ab72e4aa15`相同；完整W194 BP/RP均0.1.194，固定T202 `59e18b9330590912e3ce6b5a00fc0f004bb3ae21`／0.6.202。W使用server2.12.0-beta，T202沿其2.7.0／server-ui2.0.0；world experiments為gametest與upcoming_creator_features。沒有混入Preview1.26.70／API2.13或T203。

正式main在worldLoad安裝定時cleanup。QA只種真world保存列、呼叫正式播放及原生Block.setType；觀察到定時回呼自行產生一個native世界唱片、消耗該列，後續tick不重發。另一位置由唱片機改成真freezer後，正式planFreezerStorage建立非空原生四槽容器；機器列、native索引與同一carrier ID，在正常停止及同世界重啟後均保留。劍的名稱、raw lore、自訂DP及damage23由正式readFreezerItems讀回一致。最後透過正式storage mutation清除自己的QA容器。這證明受影響的清理／保存路徑；不是玩家插入／自然點擊或完整ItemStack／聲畫驗收。

首次setup將offline搭配allow-list=true，被BDS在進probe前拒絕，原失敗log/report保留。只把allow-list改為false，在同一engine／同一QA世界重續兩階段，沒有改runtime或probe。成功原始位於主機維護證據`java-parity-20261105/native/world-liquor-replacement-194/config-r2/`的first/restart logs、reports、alive讀回及unit journal；上層first-report仍是setup失敗，不將它改成pass。

兩次均正常stop／Quit correctly／engine exit0、playersAfter0、errors空、OOM0。執行中實讀MemoryMax2684354560／High2147483648／Swap0及獨立network namespace，服務啟動使用IPAddressDeny=any，保留2GiB主機餘裕；peak408604672 bytes。成功unit正常結束，MainPID0；transient unit卸載後的預設show值不作運行限制證據。已確認idle並清除本次QA世界／包／引擎連結與暫存peer輸入，原始報告／日誌／腳本保留，shared slot已交還。未改LIVE，W194最終peer配對及完整家族部署另由共同持有人收斂。

## W196：保存接收的完整原生唱片

W195仍只把插入唱片的typeId寫入machine row，再以new ItemStack(id)取出。正式before-interact→延後插入→空手取出的來源反例，已確認名稱、lore與公開dynamic property全被清掉；這是實際支援的改名／其他addon資料，不是未知NBT的假設。修正前的原始反例保留於本機維護進度，現回歸位於[`record-storage.test.mjs`](../tests/record-storage.test.mjs)。

`record-storage.js`沿既有NativeItemStorage保存原生ItemStack clone。歷史`freezer_inputs`實體名稱與四槽定義保留，不替換既有身份；唱片只使用第一槽，其餘保持空。唱片自己的`record_items/<dimension>/<position>`索引與冰櫃索引分開，machine row的record ID只作播放索引，不能用來重建已採原生保存的物品。metadata沒有JSON序列化副本，也沒有逐ID退休表、版本例外或私有玩法。

正式插入交易先準備完整stack及背包快照，再一起提交保存／支付；machine row或背包寫入失敗會回復原物品與資料。手動、破壞、爆炸及定時回收仍共用ejectRecord：讀取同一原生stack，spawn成功後才消耗保存列並停止自己的音訊，停止／提交失敗時撤銷暫時掉落並恢復原容器。同位置換成真冰櫃時，回收只消耗唱片自己的索引，不刪新的machine row或冰櫃容器；重載也會從唱片索引發現尚未回收的物品。共用pinning仍嚴格核對原容器／owner／token／位置，新增唱片owner沿同一核心處理。

舊plain-ID列仍由既有NativeItemStorage的單一舊列讀取邊界歸還一個普通唱片；沒有批量改世界，也不從舊列假造已丟失的名稱或其他metadata。已採原生保存後，索引／容器缺失或內容不符會保留資料並拒絕取出，不退回ID重造。回退程式與世界資料須沿既有完整備份流程一起處理，舊W195程式不認識新唱片索引，不能宣稱它能保存新資料。

來源回歸直接執行正式插入／支付／取出／破壞／爆炸回呼，以及真storage adapter與cleanup，覆蓋Survival／Creative、支付及保存失敗、metadata完整歸還、缺失原生索引、legacy plain-ID、替換家具、script重載與同carrier回復。音訊測試不再把storage作stub，而是載入正式NativeItemStorage及record adapter；引擎物件仍是fixture，不冒充原生結果。既有聲音檔、SoundInstance owner、Java落點／float spread、pickup delay限制不變。

QA-only [`record-metadata-probe.js`](../tests/native/record-metadata-probe.js)已按下方範圍執行。它import正式main，使用真native accepted stack與storage owner；來源回呼負責支付測試，probe不聲稱觀察到自然玩家插入／支付。固定BDS1.26.60.6／server2.12.0-beta及本版T203配套，沿既有實驗，無GameTest模組或模擬玩家；四個空位為事件位置、X+4／8／12並提供足夠石地／載入chunk。送`/scriptevent record_metadata_qa:run {"x":8,"y":81,"z":8}`，first觀察具名stack取出、定時替換回收且真冰櫃資料保留，再留下具名唱片／plain-ID待保存；正常stop、同一QA世界restart後送相同事件，核對原carrier與metadata、回收一次、舊列歸還及自身資料清理。保留兩個RECORD_METADATA_QA_RESULT與正常stop／players／errors／OOM／清理結果。

W194的23項只保留其原T202與舊cleanup範圍，不改稱W196完整保存通過；原生custom-sound enum失敗沿原版本證據重用，不重跑。2026-11-06核對的[官方RecordPlayer API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockrecordplayercomponent?view=minecraft-bedrock-stable)仍只有ItemType|string setter，沒有已證實的新full-stack寫入入口；一般BlockInventory文件不證明這個block具備container。原生唱片機自動化／comparator／hopper、初速／pickup delay與聲畫差距保留。

### W196 原生結果（2026-11-06）

固定W196 source/runtime `b786c706b9c8c21f01943d2eb4b1366b7a655249`、BP/RP0.1.196與T203 `6c7539689664b87f3f66ef0e93d99f2d4bd1be69`／0.6.203，官方BDS1.26.60.6、W server2.12-beta，沿原gametest／upcoming_creator_features。first11項、同一QA世界正常restart14項，共25項通過：A正式native storage接受的具名唱片由ejectRecord歸還一次；B正式cleanup在同位置換成非空freezer後歸還舊具名唱片且保留新machine row／native容器及metadata；C原carrier/index及具名唱片資料經重啟仍一致，Block.setType觸發正式cleanup回收一次；D舊plain-ID歸還一個bare disc，沒有假造歷史metadata。

實際比對的樣本包含名稱、raw lore、字串／Vector3 dynamic property、keepOnDeath及原生正規化後的canDestroy清單，唱片與新freezer物品均保留。這是QA producer送入真原生stack後，執行正式storage／eject／cleanup及持久化的觀察；接受手持物與支付回復仍屬來源正式callback測試，不冒稱玩家點擊或原生付款。完整家族保存演練、最終選包與LIVE部署另由共同流程負責。

兩次均正常stop／Quit correctly／engine exit0、playersAfter0、errors空、OOM0。實讀運行MemoryMax2684354560／High2147483648／Swap0、PrivateNetwork，服務啟動宣告IPAddressDeny=any並保留2GiB主機餘裕；peak958263296 bytes。成功unit正常結束、MainPID0，原始證據在主機維護的`java-parity-20261105/native/world-liquor-record-metadata-196/{report.json,first-report.json,restart-report.json}`及logs／alive／unit journal，清理入口為同目錄cleanup.json。自己的QA世界／包／engine links及peer-input已確認idle後刪除，raw證據與腳本保留，槽已交還root。沒有runtime修正、版本重用或新增玩法，也沒有重跑舊W19423／Jukebox14／水面／enum，P133／LIVE未改。
