# 冰櫃桶原料與Creative流體轉移

## 2026-11-13來源候選：單桶轉移保留使用中的手持槽

目前NeoForge作者1.1.12仍呼叫官方`FluidUtil.interactWithFluidHandler`。其非Creative單件分支直接回傳轉換結果，再由呼叫者寫回原手；只有尚有堆疊剩餘時才收納額外結果。原生既有`transaction.give`一律先合併及搜尋背包，會把單桶轉換結果放到較前的空格／既有桶堆，反而清空玩家正在使用的手持槽。

本候選在同一交易owner加入`containerResult`：扣除後原槽為空，就把轉換結果放回該槽；有剩餘堆疊則沿用原收納流程。只有非牛奶加液體、空桶取液體兩個呼叫使用此選項。Creative仍保留原物與metadata，滿槽普通入料、牛奶特殊加槽、storage格式及交易失敗回復均不變。

[證據與執行範圍](evidence/freezer-fluid-hand-20261113/README.md)：87個新正式回呼案例在修前36失敗、51通過，修後連同既有回呼與storage套件234項全過；完整來源檢查1350個geometry、0錯誤。這是來源／API-double驗證，沒有重用下節舊BDS結果冒充新修復驗收。新候選未做BDS、玩家點擊、客戶端或保存重啟；版本／baseline guard維持未滿足，尚未發版。

已知另一個未修範圍：堆疊容器加滿背包時，Java可走`ItemHandlerHelper.giveItemToPlayer`的溢出流程，目前原生交易仍拒絕。此次不以另一種掉落動作替代、不宣稱完整FluidUtil或offhand／任意流體容器一致。

## 既有W199與W200證據

2026-11-06核對當前NeoForge1.21.1作者1.1.12／CF9217896與Forge1.20.1作者1.1.13／CF9217901。W199修「流體轉移失敗後，整桶仍可放進原料格」；W200只修Creative成功取槽液時的庫存副作用。兩條路徑的Creative扣料規則不同。

## Java來源與已重現的差異

兩個作者分支的`FreezerBlock`都先嘗試`FluidUtil.interactWithFluidHandler`；只有成功才結束，失敗則進`FreezerBlockEntity.insertItem`。滿的1000mB水槽無法再接一整桶，滿桶也不能從槽內再裝液體，所以轉移失敗。`insertItem`仍把一個完整ItemStack複本放進空原料格，再縮減手持數量，沒有Creative豁免。對應loader的官方實作見[NeoForge1.21.1 FluidUtil](https://github.com/neoforged/NeoForge/blob/1.21.1/src/main/java/net/neoforged/neoforge/fluids/FluidUtil.java)與[Forge1.20.1 FluidUtil](https://github.com/MinecraftForge/MinecraftForge/blob/1.20.1/src/main/java/net/minecraftforge/fluids/FluidUtil.java)；本段依各分支控制流程推得，不宣稱已執行完整Java遊戲。

W198的`furniture.js`對非牛奶滿桶先按ID分流，遇到`s.fluid`就直接return。可由正式before-interact→deferred→原料路徑重現：開蓋、閒置、水槽已滿且原料格有空位，手持水桶／岩漿桶／葡萄汁桶／莓汁桶；Survival及Creative的八案都留下空原料列，手持不動。這是實際可達的來源回呼反例，不是原生點擊證據。

## 修復與範圍

只有空槽才進既有加液體分支；滿槽改落到既有`insertFreezerInput`，不複製扣料、保存、回復或音效邏輯。完整桶保存在原有native carrier中，水槽保持原液體，Creative普通原料仍扣一個。四格已滿、製作中、製成品待取、空槽加液體及取製成品等原有規則保留；不新增任意FluidUtil能力或保存格式。

[正式回呼回歸](../tests/freezer-callback.test.mjs)的八案檢查原料列、手持扣料、槽液不變、原料音效及取回後的名稱／lore／自訂資料。修復後該套件46項通過。指南由固定T203生成並檢查，內容只需版本同步。

[定向QA observer](../tests/native/freezer-full-tank-probe.js)已完成Survival水桶與Creative岩漿桶兩案。[實際結果](evidence/freezer-full-tank-20261106.json)的首次17項及同一QA續驗重啟13項通過：實際Native Player庫存／ItemStack走正式元件回呼，手持扣一、完整取樣metadata入carrier；正常保存後核同carrier／metadata並各取回一次，槽液仍water。回呼由fixture呼叫，不冒稱原生玩家點擊。runtime固定7d12d524，首次observer亦7d12d524，重啟observer為f2ab0db3；只有QA前提與比較範圍修正，沒有為此改runtime。

前兩場在chunk未載入／多餘air-clear指令時停止，沒有完整玩法結果。首次17項有效後，重啟fixture先因整列比較包含正常新增的redstonePowered=false失敗；離線讀停服DB核對受影響資料未變，改只比較桶／槽／製作欄位，保留完整metadata比較。隨後取回前未恢復開蓋前提，離線讀實際座標palette證實兩蓋均關；恢復QA開蓋前提後只續驗原QA的restart13，沒有重跑first17。紅石／蓋子生命周期不在本次通過範圍；失敗log與原始報告保留。

成功兩phase均normal stop／Quit correctly／engine exit0，players0、errors[]／OOM0。最終service成功退出；自己的QA／peer payload已在真host及共享鎖內assert_idle後清理、時段歸還。布丁、重生傳送、舊完整storage矩陣與完整家族保存循環均未重跑。

offhand、任意流體容器／addon capability、完整自動化、掉落物物理及真人畫面仍保留原範圍。共同完整家族保存／部署依其當前入口，來源修復不等於已安裝。

## W200：Creative成功流體轉移

上列兩個loader的`tryFillContainerAndStow`／`tryEmptyContainerAndStow`均在`instabuild`分支執行真正的槽液轉移，成功後回傳原container；不產生額外物品，也不查庫存是否能收另一個桶。這與後續普通`insertItem`沒有Creative豁免，是兩個不同語義，沒有查到owner另定相反規則。此處依官方程式控制流程核對，不宣稱跑過完整Java遊戲。

| Creative情境 | 手持與庫存 | 槽液 | 本次結論 |
| --- | --- | --- | --- |
| 非牛奶滿桶→空槽，轉移成功 | 完整原桶不變，不另給空桶 | 變成該液體 | 現來源正確；8個正式回呼控制通過，不修此分支 |
| 空桶→滿槽，轉移成功 | 完整原空桶不變，不另給滿桶；背包滿也可成功 | 清空 | W199有空位會多給滿桶，背包滿會拒絕清槽；W200修此分支 |
| 滿槽已無法轉移，落到普通入料 | 扣1個完整桶存進原料格 | 不變 | 保留W199，不能套用成功轉移的免扣料規則 |
| 牛奶桶特殊加槽 | 原牛奶桶不變，不另給空桶 | 變成milk | 保留既有獨立路徑，不混作FluidUtil新證據 |

正式before-interact→deferred回呼在既有水／岩漿／兩果汁／milk別名，以空位和滿背包各一案重現10個取液失敗；另8個非牛奶加槽控制原已符合規則。修復只讓取液的`transaction.give`在Creative為空，沿用現有不扣Creative手持及槽／庫存回復；不新增registry、UI、保存格式或另一個交易owner。受影響的來源callback套件64項通過，包含W199滿槽普通入料仍扣一個。

[新窄QA observer](../tests/native/freezer-creative-fluid-probe.js)已完成真正改動的兩案。[實際結果](evidence/creative-freezer-fluid-20261106.json)為首次13／同一QA重啟7項PASS：Creative持3個具名空桶、庫存有空位／36格全滿，真Native Player完整取樣庫存經正式元件回呼保持相同、槽液清空、不產滿桶；同一QA正常重啟兩槽仍空、沒有原料或carrier。固定runtime2f2ca054，實測observer/source fadecaee；回呼是fixture呼叫，不稱native click，不宣稱模擬玩家庫存跨重登保存。W19917＋13、布丁或Respawn均未重跑。

兩次QA前提失敗保留原始資料：此選定引擎拒絕在可堆疊空桶寫DP，故只使用原生支援的name／lore／keepOnDeath／canDestroy；另一場新方塊初始化清掉預填槽液，回呼實際走普通入料，離線停服DB與block-state已釐清。只將QA滿槽／開蓋宣告移到初始化後並加前提witness；未因fixture失敗再改runtime。成功兩phase均正常stop／Quit correctly／engine exit0、players0、errors[]／OOM0；最終service成功退出，自己的QA／peer已在真host及共享鎖內assert_idle後清理並還槽，raw／logs／JSON保留。
