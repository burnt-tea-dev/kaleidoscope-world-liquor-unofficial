# 世界名酒：開放差距與驗收場景

現行 LIVE 為 W119／T142／G123，2026-10-09 已完成完整 42 包 static、新世界／保存世界首次及重啟、准入與部署讀回。真人操作及完整 Java 一比一仍未接受；`client=false`、`production_ready=false`。[現行家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/82beed26/family/BASELINE-STATUS.md)記錄本次收據；成功載入沒有關閉下列具體玩法差距。

來源、已完成範圍和證據等級只維護在 [PARITY-MATRIX.md](PARITY-MATRIX.md)。舊 W114／W115／85-helper 敘述和各版失敗仍由 Git、release notes 與原收據保留，本頁不再複製整份矩陣或把舊版本當成當前阻擋。

## 本分支已修，待發版

斬首誤用了 ground-crit 的 melee／explosion 篩選，漏掉直接生物造成的爆炸傷害，亦未檢查目標仍存活；肘擊音效漏了直接生物類別。現行原作 CF9066406 的兩個 handler 分別要求 direct LivingEntity，只有 ground-crit 額外使用 melee 篩選。最小修補及 16 個既有套件案例見 [來源核對](../data/combat-admission-review-20261009.json)。完整斬首流程仍開放，不能把入口修補寫成 SkullOwner、補殺或 causal drops 已完成。

## 實作差距

| 項目 | 剩餘問題 | 可分辨場景 |
|---|---|---|
| Luck | 1.21.1 的 vanilla Luck attribute／loot context 尚無完整 native adapter；26.1.2 的 custom reroll 是另一套玩法 | 同工具、loot table 與 Luck 等級比較 Java／Bedrock，分開記資料等級和實際掉落 |
| 斬首與頭顱 | Incoming cancellation、owner-attributed 重入、blocked fallback、marker 保存、同次 drops 去重及玩家頭 owner 未完成 | 取消／護甲／Tequila／圖騰、已死目標、原本已掉頭、玩家頭與重啟後標記各自對照 |
| 尋寶指南 mob drops | 現行一 tick 鄰近新 item 掃描沒有實際死亡 drops 集合的來源證明 | 兩個 mob 同 tick 死亡、玩家丟物、旁邊新 item；額外物品只能屬於本次死亡 |
| Elbow | 精確 Java attack attribute／charge／resistance 與原生 buffered knockback 組合尚未接入；固定 extra impulse 不等價 | ground／真正 airborne、任意原速度、resistance、Player charge／mob attack 分別量測 |
| CaptainGift | 現行 source-water 浮力不能替代原作 12 格 water-fluid／AABB 移動裁切、fallDistance 和 onGround | flowing water、岸邊、sneak、掉入水面、不同生物寬度及其他移動效果 |
| Creative Flight／outline／Brew Accelerator | 缺原生完整飛行權限、穿牆輪廓或原作 enchantment／operator 入口 | 效果結束／重登後權限、視角遮擋與原作 cooldown；不改正式世界實驗旗標 |
| 自動化與其他模組 | Cabinet transfer／comparator、FluidUtil、Forge event、Create／Jade／SMC 尚未完整適配 | 保留現行容器資料與互動次序，再對每個 hook 單獨比較 |

## 保留實作，仍待真人或特定生命周期驗收

- 冰櫃：五個 current recipe、loaded ticks、四槽 native metadata 及來源 height 算術已實作；真玩家插取、offhand、unload／crash、任意 metadata 和完整流體／原料／成品渲染另驗，不把 LIVE 零輸入樣本當非空證據。
- 酒櫃與家具：原格位、native item carrier、重啟／回滾修補保留；四向座位、玻璃、觸控／游標點選與實際展示仍待比較。
- Respawn：87 個精確零碰撞 helper、新確認錨 yaw=0／forced=false 及 repeat／取消防線保留；未知來源不放寬，真 Player 床／錨／重生另驗。
- 唱片：兩首原音檔、牆掛四向及取回保留；32 station 音訊渠道仍是 adapter 限制，實際聲場、播放／停止／重登 lifecycle 待驗。
- 指南：67 個 W 商品頁、公開配對 223／完整家族 227 條目及三語接收已通過；玩家實際排版／返回、輸入和兩入口閱讀仍待接受。

## 分支與歷史

NeoForge 1.21.1／CF9066406 是目前玩法 authority；Forge 1.20.1／CF9066402 分開追蹤。[current-author-review](../data/current-author-review-20261009.json)保留選定資料／素材核對。26.1.2／CF9087098 的 Luck、BlockDrops、配方、註冊及 automation 差異仍須分支適配，不能只換 pin 或混入 1.21.1。完整已完成／剩餘範圍見矩陣；[Phase 0](audit/AUDIT.md)與歷史 release notes 保留當時來源及驗收界線。
