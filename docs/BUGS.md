# 世界名酒：開放差距與驗收場景

## 當前入口（2026-10-27）

目前來源由 [baseline](../baseline.json) 定義；唱片改為獨立音訊實例，移除 32 渠道及全域停止限制。來源、公開下載及倉庫最後記錄部署各自的配套只維護在[家族主索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)；每項實作狀態見[PARITY-MATRIX](PARITY-MATRIX.md)，本頁保存具體回報與場景。

本次重新列出布丁餘碗差距，並保留使用者指定延後修復的Treasure Guide生物掉落問題。current `effects.js`與W148相同的來源核對沒有新增native重現；已修的冰紅茶matcher、四杯mesh／UV、冰櫃材質及唱片來源修補仍由矩陣承接。全物品Blockbench及完整真人驗收仍未完成。`client=false`、`production_ready=false`。

目前 LIVE 版本、完整家族部署結果及精確收據統一記錄在 [家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)。真人操作及完整 Java 一比一仍未接受；`client=false`、`production_ready=false`。部署成功沒有關閉下列具體玩法差距。

來源、已完成範圍和證據等級只維護在 [PARITY-MATRIX.md](PARITY-MATRIX.md)。舊 W114／W115／85-helper 敘述和各版失敗仍由 Git、release notes 與原收據保留，本頁不再複製整份矩陣或把舊版本當成當前阻擋。

## 2026-10-14 歷史客戶端回報與當時修補

玩家確認原生 HUD、AMW 的 Java 飢餓 UI 和 Java Saturation 正常，只有森羅調酒／進食圖形缺失；多次指示文字未出現，後續截圖直接顯示內部 `KT_HUD!` 資料碼。這些是真實失敗，不能改寫為「未測」或以送出成功關閉。後續截圖已看到調酒色塊與進食畫面，但仍回報位置過高、進食條延遲，以及雪克杯按很久才顯示／效能不佳。

- T163/G137 恢復原有 Actionbar 圖形事件，完整家族宿主補明確掛載；該輪及後續 G138 的截圖仍失敗，結構檢查沒有證明畫面恢復。
- G138 補串的原生觸控使用入口；後續圖中有進食姿勢與數量變化，但完整進食／取消／結算仍未獲真人接受。
- T165 修正 Java `GUI height / 2 + 32` 的相對座標；G141 依剩餘 ticks 計算進度並在開始事件同步送首幀。先前「位置正確」的判斷撤回。
- 目前 T166/G142 對未選圖形使用 `ignored`，T166 對未變雪克杯閒置預覽設有界快取；同步首幀與玩法結算保留。沒有實測證明已消除客戶端延遲或改善 FPS，問題仍開放。使用者已要求停止畫面探針，未再發送。

W144 [PR127](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/127) 是這批修補的配對更新，沒有另改世界名酒玩法。2026-10-14 21:41:21 HKT 已部署 T166/G142/W144；W144 來源 CI [38570678514](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38570678514)、main CI [38570924878](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38570924878) 及正式發布 [38574143687](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38574143687) 通過。整套存檔副本首次／重啟、42 包啟動及六個公開包 9,349 檔核對通過；本次 reviewed receipt 為 `fca0008bef68b99b4dfd5e0f3f8e3a0e24807ad1840fc2a6378b828c8b44d0e8`。這些不代表真人畫面／延遲、任意設備或完整 Java 一比一已接受。

## W120 已修的入口

斬首誤用了 ground-crit 的 melee／explosion 篩選，漏掉直接生物造成的爆炸傷害，亦未檢查目標仍存活；肘擊音效漏了直接生物類別。現行原作 CF9066406 的兩個 handler 分別要求 direct LivingEntity，只有 ground-crit 額外使用 melee 篩選。最小修補及 16 個既有套件案例見 [來源核對](../data/combat-admission-review-20261009.json)。完整斬首流程仍開放，不能把入口修補寫成 SkullOwner、補殺或 causal drops 已完成。

## 實作差距

| 項目 | 剩餘問題 | 可分辨場景 |
|---|---|---|
| 布丁餘碗／食物完成 | 仍統一插入inventory；原作最後一份回傳新碗供hand replacement，非空／Creative則spawnAtLocation；Luck／原作random draw亦未完整適配 | Survival最後一份／多份及Creative各自核對碗去向與真實debit順序，並驗取消／換槽；不重啟已停用探針 |
| Luck | 目前兩條維護分支已使用 custom Luck；原生生物死亡／掉落已適配，完整原始 LootContext、無掉落事件、挖礦／箱子／釣魚仍缺 | 目前來源與原生證據見[矩陣](PARITY-MATRIX.md)；分開記錄原始 context 和真玩家結果 |
| 斬首與頭顱 | Incoming cancellation、owner-attributed 重入、blocked fallback、marker 保存、同次 drops 去重及玩家頭 owner 未完成 | 取消／護甲／Tequila／圖騰、已死目標、原本已掉頭、玩家頭與重啟後標記各自對照 |
| 尋寶指南 mob drops | 現行一 tick 鄰近新 item 掃描沒有實際死亡 drops 集合的來源證明 | 兩個 mob 同 tick 死亡、玩家丟物、旁邊新 item；額外物品只能屬於本次死亡 |
| Elbow | 精確 Java attack attribute／charge／resistance 與原生 buffered knockback 組合尚未接入；固定 extra impulse 不等價 | ground／真正 airborne、任意原速度、resistance、Player charge／mob attack 分別量測 |
| CaptainGift | 現行 source-water 浮力不能替代原作 12 格 water-fluid／AABB 移動裁切、fallDistance 和 onGround | flowing water、岸邊、sneak、掉入水面、不同生物寬度及其他移動效果 |
| Creative Flight／outline／Brew Accelerator | 缺原生完整飛行權限、穿牆輪廓或原作 enchantment／operator 入口 | 效果結束／重登後權限、視角遮擋與原作 cooldown；依能力需求聲明實驗旗標並先在隔離世界驗證 |
| 自動化與其他模組 | Cabinet transfer／comparator、FluidUtil、Forge event、Create／Jade／SMC 尚未完整適配 | 保留現行容器資料與互動次序，再對每個 hook 單獨比較 |

## 保留實作，仍待真人或特定生命周期驗收

- 冰櫃：五個 current recipe、loaded ticks、四槽 native metadata 及來源 height 算術已實作；真玩家插取、offhand、unload／crash、任意 metadata 和完整流體／原料／成品渲染另驗，既有零輸入樣本不證明非空冰櫃內容。
- 酒櫃與家具：原格位、native item carrier、重啟／回滾修補保留；四向座位、玻璃、觸控／游標點選與實際展示仍待比較。
- Respawn：87 個精確零碰撞 helper、新確認錨 yaw=0／forced=false 及 repeat／取消防線保留；未知來源不放寬，真 Player 床／錨／重生另驗。
- 唱片：兩首原音檔、牆掛四向及取回保留；W168 已移除 32 station bank，實際聲場、播放／停止、進出與重登 lifecycle 仍待真人驗證。原生 custom record 的 parser compatibility、comparator、hopper 與完整 ItemStack 行為仍開放，見 [可重現證據](RELEASE-NOTES-0.1.168.md)。
- 指南：67 個 W 商品頁、公開配對 223／完整家族 227 條目及三語接收已通過；玩家實際排版／返回、輸入和兩入口閱讀仍待接受。

## 分支與歷史

目前維護分支及這次採用範圍見[來源覆核](../data/current-author-review-20261028.json)。26.1.2仍是另行待適配分支。完整已完成／剩餘範圍見矩陣；[Phase 0](audit/AUDIT.md)與歷史 release notes 保留當時來源及驗收界線。
