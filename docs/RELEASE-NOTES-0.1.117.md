# 0.1.117：魚類 LivingEntity 效果與傷害歸屬修復

W117 配對 **Tavern 0.6.140**，承接已發布 W116
`dd56def61d5b66d9bbc9e697e5e272e5f9e3ed4b`。本候選來源／回呼回歸已通過，
新原生場景仍為 **pending**。

## 來源與修復

效果權威是[官方 CF9066406](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9066406)，
NeoForge Minecraft 1.21.1、World Liquor 1.1.11。重新取得的 archive 與
[現行作者紀錄](../data/current-author-review-20261009.json)一致，SHA256：

`e1f51736138bfe65ac1ce2aae2f2f3bd292dce71e2b8d2f18580a68bdea807cc`

原作 `MultiJumpFallDamageMixin` 與 `DamageEvents.onLivingDamagePre`
適用所有 LivingEntity。舊入口要求 `mob` family，漏掉 cod 等魚類；
新表的 **84 個精確 Native ID** 與配套 Tavern 的 LivingEntity 投影
逐項一致，魚類因此能進入既有 MultiJump 摔落免傷、Tequila float 上限、
Server instant-effect 路由及 accepted afterHurt 傷害歸屬流程。

入口仍要求 health／有效 handle，保留 addon mob 適配，拒絕 health-only
車輛、未知實體與 prototype 鍵。生命值為零不改類別，但後續 mob kill
credit 仍要求存活。`BEHEADED_MARKER` 在取消原傷害前寫入是作者設計；
本版 `effects.js` 事件順序與數值公式未改。

## 驗證與邊界

七個新增反例先在舊程式失敗；修補並加入完整類別投影後，
`tests/kill-credit.test.mjs`、`tests/combat-source.test.mjs` 共
**26／26 通過、0 skip**。測試使用 `installEffects()` 正式註冊回呼。
獨立唯讀審查重跑其中 **8 個案例，8／8 通過**，沒有 blocking 問題；
這是原套件子集。`git diff --check` 亦通過。

T140 新 probe 將經正常 timed effect 與公開 `effect_snapshot` 確認
MultiJump，下一 tick 比較 cod 原生 fall 免傷與無效果 cod 的 1 點傷害。
**尚未執行，不能以 source/API 或舊版原生結果代替通過。**

已發布三語指南／七入口、作者 Dassai／模型／聲音、確認重生錨與宿主
既有 aura 保存／倒數／載入／外部接管修補均保留；[W116 證據](RELEASE-NOTES-0.1.116.md)
維持原來源範圍。Forge 1.20.1 與 NeoForge 26.1.2 仍分開追蹤。
原生 Luck 掉落、高球 Creative Flight、完整斬首／Elbow／CaptainGift、
已列其他效果差距與 Player／畫面／音效／完整私人家族／存檔／LIVE
仍待完成或驗收。維持 `client=false`、`production_ready=false`、
`live_deployment=false`，不宣稱全面一比一。
