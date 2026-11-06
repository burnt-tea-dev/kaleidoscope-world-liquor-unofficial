# 滿槽冰櫃的桶原料（W199）

2026-11-06核對當前NeoForge1.21.1作者1.1.12／CF9217896與Forge1.20.1作者1.1.13／CF9217901。這次只修「流體轉移失敗後，整桶仍可放進原料格」的分流。

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
