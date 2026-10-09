# 0.1.117：魚類 LivingEntity 效果與傷害歸屬修復

W117 配對 **Tavern 0.6.140**，承接已發布 W116
`dd56def61d5b66d9bbc9e697e5e272e5f9e3ed4b`。本候選來源／回呼回歸與
新增配套原生首次／保存／重啟場景已通過，真人驗收仍 pending。

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

T140／W117 的 BDS 1.26.52.3 首次 21 項、正常保存／重啟 22 項及
嚴格來源 recorder 已通過，兩次 0 玩家、0 錯誤、正常停止。
[本輪原生證據](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/0818d91cdf648b9173e732bf45057da78743fa4d/docs/native/T140-W117-20261009.json)
記錄實際 API `fall` 傷害：control cod 3→2／一次 afterHurt；經正常
timed effect 和公開 snapshot 套用 MultiJump 後 3→3／零 afterHurt，
首次與重啟相同。兩階段各重新建立鱈魚並施效，此案例不證明
MultiJump 跨重啟保存；未測自然墜落高度、真人飲用／操作或渲染。
實測 runtime 為 T `67822848d85240640867f10d3bd6fc613262a8d1`、W
`0c311dab5b1488add7f8118bb0dca7d8302acd62`；正式完整 CI 由本 PR 執行。

已發布三語指南／七入口、作者 Dassai／模型／聲音、確認重生錨與宿主
既有 aura 保存／倒數／載入／外部接管修補均保留；[W116 證據](RELEASE-NOTES-0.1.116.md)
維持原來源範圍。Forge 1.20.1 與 NeoForge 26.1.2 仍分開追蹤。
原生 Luck 掉落、高球 Creative Flight、完整斬首／Elbow／CaptainGift、
已列其他效果差距與 Player／畫面／音效／完整私人家族／存檔／LIVE
仍待完成或驗收。維持 `client=false`、`production_ready=false`、
`live_deployment=false`，不宣稱全面一比一。
