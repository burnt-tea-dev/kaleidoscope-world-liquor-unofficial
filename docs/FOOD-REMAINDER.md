# 布丁餘碗：來源與原生時序範圍

2026-11-06核對，runtime仍為W198。尚未找到已重現的漏碗／多碗反例，本次不改玩法或升版本。

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

[官方System.run](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/system?view=minecraft-bedrock-experimental#run)不保證固定下一tick；可在同tick結尾或其後執行。故當前可確認的是「延後讀slot」，不能僅憑這個呼叫宣稱Native所有寫入一定已落地。現有runtime註解仍有較強的next-tick說法；保留此差異待實際階段觀察，不為改一句export註解製造新pack身份。歷史W92／W172說明保持其原時點範圍。

## 最小後續觀察，尚未執行

[QA observer](../tests/native/food-remainder-probe.js)只準備3案：Survival1份、Survival3份、Creative1份。使用實際布丁定義及`useItemInSlot`，不手動扣料、不直接呼叫completeFoodRemainder或偽造完成事件。普通meal控制沿用上節；若第一案缺真正Native完成／扣料witness，保留raw結果並停，不改用合成callback湊過。

單一隔離QA載固定W198＋T203，BDS1.26.60.6／server2.12-beta、QA-only GameTest1-beta與既有實驗。runner先用server-console啟用現有`kaleidoscope_world_liquor:food_phase_trace start`，再送`food_remainder_qa:run`。保留complete_before／complete_after／consume／consume_next_tick及observer逐tick的slot、食物數、背包＋世界碗總數、原生事件與正式diagnostics；40tick後停止使用，再讀4tick，避免一按API返回true便當成功。

只有Native完成一次且扣料符合模式後，才判斷一個碗是否守恆與HAND／DROP是否符合上表；多個原生完成事件或沒有完成witness不得直接歸罪產品。原生只完成一次卻有兩次正式交付則是真正反例。沒有取消、直接離線、offhand、人類輸入或掉落物完整物理的通過聲明，也不另立真人驗收等待。

此觀察須在共同整批工作及已排T高跟鞋之後，另由共同安排native槽。尚未啟BDS、未持共享鎖或改LIVE；准入仍用新鮮host／端口／2GiB reserve、既有venv／flock／2.5GiB Max／2GiB High／Swap0／PrivateNetwork／IP deny。一次QA啟停即可，沒有新持久資料需要另跑完整家族保存循環；完成後正常停服清自己的QA並還槽。
