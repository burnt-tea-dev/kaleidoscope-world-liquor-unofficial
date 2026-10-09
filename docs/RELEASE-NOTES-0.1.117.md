# 0.1.117：配對酒館載入光效修復

W117 以已合併 W116
`dd56def61d5b66d9bbc9e697e5e272e5f9e3ed4b` 為基礎，配對 Tavern
0.6.140，Grilling 保持 2.8.122
`8002da0086544cd18c9854e7fe79e8ccb2f9f982`。

## 實際變更

本版只同步 BP／RP／module／payload 的新身份及精確 Tavern 相依。
W116 的所有玩法、已確認下界重生錨 metadata、67 個三語指南條目、
配方、作者效果資料、模型、貼圖及音效保留。這不是新增 World Liquor
玩法或完整原作適配；舊版本與來源歷史不改寫。

T140 修正原生載入時把等值外部效果刷新當作原生載入確認，以及
玩家 initialSpawn 交错時遺失或重發光效票券，並補回完整 native
證據輸入綁定。保留既有機器／雪克杯原料保存、Mob、視覺、沉浸
與共享指南修補；宿主範圍見 Tavern 本版說明。

Tavern 的實際已審查來源固定為
`c1fdc5f8f80eaa4ab96e425aee3f3f97274ceadb`，包括完整 T140 功能、
原始歷史見證、58 項 aura／14 項 recorder 定向結果與 archive 身份。
CI 與發布共用此 exact checkout，來源不指向移動分支。

## 驗證與來源

兩個包宣告的 Tavern UUID／version、CI 與發布的 immutable checkout
必須一致。來源保留核對限定本次三個身份檔案，完整指南 body 與
其他 runtime bytes 不变；正式 packager 核對乾淨凍結來源與每個
archive entry，expected archive SHA 由實際產物取得。

本版完整 `Release package checks` 與配套 T140 的
`Canonical validation/native-persistence` 各自提供最終 commit 的
實際結果。原生完整契約仍為首次 20／重啟 21 案例；report 在啟動前
保存的兩庫來源及全部 overlay 必須精確相符，不能用舊 T139／W116
結果改名。具體成功／失敗與原始日誌以該固定 PR 的 Actions 為準。

Grilling G122 與 Cookery helper 0.2.9 的完整私人家族整合另行驗證。
本輪沒有真人 Player 重生錨或登入、渲染／音效／輸入驗收，也沒有
私人世界保存遷移或 LIVE 部署。原生 Luck、Creative Flight、模組
事件與其他已列原作差距保留；`client=false`、
`production_ready=false`、`live_deployment=false`。
