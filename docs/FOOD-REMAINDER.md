# 布丁餘碗：來源與原生時序範圍

2026-11-06核對，runtime仍為W198。最後一份／多份／Creative三案已取得真正Native完成及扣料witness，沒有漏碗或多碗；本次不改玩法或升版本。

## 兩個維護Java分支

NeoForge1.21.1作者1.1.12／CF9217896與Forge1.20.1作者1.1.13／CF9217901的`KTItems`均把布丁註冊為帶Bowl remainder的`CompatFoodItem`。Forge的`Items.f_42399_`由固定MCP1.20.1映射對到Mojang同一個`Items.BOWL`。兩份`finishUsingItem`都先呼叫super，再看使用中的原stack是否已空：

| 完成食用時 | 原作結果 |
| --- | --- |
| Survival最後1份 | super扣完，回傳1個新碗，由原生complete-use放回用到的手 |
| Survival仍有份數 | 原食物stack保留，在玩家位置spawnAtLocation一個碗 |
| Creative | super不扣食物，仍在玩家位置掉一個碗 |

對應Mojang1.20.1的`LivingEntity.eat`在非instabuild時shrink；1.21.1經`ItemStack.consume(1,entity)`尊重無限材料能力。沒有依據把Creative改成不還碗，或讓多份食物把碗直接塞背包。

## 目前實作與已有證據

正式`main.js`元件只在onCompleteUse套效果並呼叫`completeFoodRemainder`；onConsume只是既有唯讀trace，不另給碗。`food-remainder.js`捕捉原slot與完成時模式，交`system.run`延後讀同slot，然後在HAND／DROP／RELOCATED三條分支中交付一次。換格與例外仍沿既有保護及diagnostics；沒有新增重試或永久記錄。

既有13項[來源測試](../tests/food-remainder.test.mjs)直接呼叫正式實作及註冊元件，最後一份、多份、Creative、換格、離線及API失敗在其模型範圍通過。它們不證明Native扣料時刻；原先聲稱「第二次settle無寫入」的test標題實際只呼叫一次，已改成其真正範圍，沒有新增假冪等保證。這13項現在亦接入既有package CI。

可沿用的[相同BDS1.26.60.6／server2.12-beta／GameTest1-beta原生食物控制](https://github.com/burnt-tea-dev/kaleidoscope-grilling-unofficial/blob/92df38e36de380a3ef8c5c71c5504f17273a672b/tests/native/eating-debit-spike/observed.json)已觀察一般100-tick meal由2→1，完成事件一次；另一最後1份控制在完成事件讀回0。這證明該輸入方法可以走真Native食用，不重跑一般控制、早扣料或離線API試驗。它沒有世界名酒布丁元件及Creative餘碗結果，不能移作該項通過。

[官方System.run](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/system?view=minecraft-bedrock-experimental#run)不保證固定下一tick；可在同tick結尾或其後執行。本次三案的complete_before／complete_after／consume／延後觀察實際全在各自同一tick，最後一份的延後觀察已見手中碗；consume_next_tick只是既有trace的名稱，不代表時鐘真的加一。Survival進complete_before時已扣成空格／2份，Creative仍1份。當前實作在這些實際階段下正確，不等於所有Native時序有固定保證。runtime舊next-tick註解未改；此差異在本節明列，不為一句export註解製造新pack身份。歷史W92／W172說明保持其原時點範圍。

## 本次三案原生觀察

[QA observer](../tests/native/food-remainder-probe.js)已完成3案：Survival1份、Survival3份、Creative1份。使用實際布丁定義及`useItemInSlot`，不手動扣料、不直接呼叫completeFoodRemainder或偽造完成事件。普通meal控制沿用上節，沒有重跑；探針仍保留缺Native witness就partial止步的條件。

單一隔離QA載固定W198＋T203，BDS1.26.60.6／server2.12-beta、QA-only GameTest1-beta與既有實驗。runner先用server-console啟用現有`kaleidoscope_world_liquor:food_phase_trace start`，再送`food_remainder_qa:run`。[實際結果](evidence/food-remainder-20261106.json)保留complete／consume階段、原生事件與正式diagnostics；完整逐tick原始資料由共同證據保存。40tick後停止使用，再讀4tick，每案皆原生完成一次、正式交付一次：

| 場景 | 食物真實變化 | 餘碗結果 |
| --- | --- | --- |
| Survival最後1份 | 1→0 | 原slot換成1個碗，HAND一次 |
| Survival3份 | 3→2 | DROP一次，最終碗已被自己撿回背包，淨1個 |
| Creative1份 | 1→1 | DROP一次，布丁保留，最終淨1個碗 |

所有採樣的世界碗數均為0；DROP分支由正式實作在Native spawnItem返回實體後的diagnostics確認，最終背包與世界合計守恆。這不是掉落物位置／物理的可視證據，不把自動撿回後的背包結果誤稱Java直接插入背包。

只有Native完成一次且扣料符合模式後，才判斷一個碗是否守恆與HAND／DROP是否符合上表；多個原生完成事件或沒有完成witness不得直接歸罪產品。原生只完成一次卻有兩次正式交付則是真正反例。沒有取消、直接離線、offhand、人類輸入或掉落物完整物理的通過聲明，也不另立真人驗收等待。

此觀察已按共同時段在G正常清槽後完成，沿既有host／端口／2GiB reserve、venv／flock／2.5GiB Max／2GiB High／Swap0／PrivateNetwork／IP deny准入。單次QA正常stop／Quit correctly／engine exit0，players0、內容errors[]／OOM0；自己的世界／包／引擎連結與peer輸入已清理、時段歸還，raw資料保留。沒有第二世界、restart、完整家族保存循環、runtime變更或LIVE操作。
