# 0.1.118：保留完整指南，配對載入光效修復

W118 以已合併 W117
`0ebf77ed7d302f453e75d9c56cc603e709ed226d` 為基礎，只同步 own／module／
payload 版本及 Tavern 0.6.141 精確依賴。全部 67 個三語指南、確認
的下界重生錨 metadata、配方、效果、模型、貼圖與音效保持原樣。

T141 保留最新 T140 的 AMW 四頁指南與精確 receiver 邊界，再加入
invalid-before／entityLoad／同 tick after 的光效來源限制、玩家
initialSpawn 消耗狀態保存，以及 native recorder 完整輸入綁定。
公開指南仍為 223 條目，完整家族 227 條目的範圍與待驗收狀態保留；
不能用公開配套測試替代私人 producer／Cookery 的實際接收結果。

G122 固定 `8002da0086544cd18c9854e7fe79e8ccb2f9f982`，Cookery helper
0.2.9 須以同版本 descriptor、作者 patch 與 copied helpers 整組驗證。
精確 Tavern checkout 由 integration／release request 同時固定；
兩個 manifests 的宿主 UUID 與 version 必須逐側相符。

本輪 World Liquor runtime 只有兩個 manifests 及一個 payload 身份檔
變更。舊 W117 frozen claims 與已發布 history 保留；舊 aura 候選的
W117 runtime 本來就與本輪 base 完全相同，但其 host peer／CI 證據
保持各自提交，不挪用成新 W118 成功。

完整 `Release package checks` 與配套 T141 `native-persistence` 以
固定 PR 的實際 Actions 與 raw artifacts 為準。原生契約為 first 20／
restart 21，須綁定啟動前 source／全部 overlay，不能改標舊報告。
正式封裝由乾淨凍結 source 產生並逐 entry 核對；此處是封裝完整性，
不等於真人操作／畫面／音效或完整原作適配。

原生 Player、真人輸入、Luck／Creative Flight 等既有差距、完整
私人家族、保存世界與 LIVE 仍依各自範圍待處理。持續部署授權保留；
`client=false`、`production_ready=false`、`live_deployment=false`。

## 固定配對來源

Tavern T141 審查來源固定
`3f91abbdb9cda2e2b51965c4858229e2c1feab1a`，完整 Git tree
`72fb6f6ee3b8f1a014e8f9395352fa879c37775c`。Integration 與 release
request 共同引用此提交；後續 Tavern 只固定本版 CI peer，凍結 runtime
保持相同。GitHub checks 仍核對最終各自完整來源，不把來源相同視作真人驗收。

## 凍結封裝

本版 runtime 審查來源 `abf7a605a1ac8e0a81f3bce620a9c04bdafbaad8`，完整 Git
tree `3abbe7428120189f1bad0a5e03001bdffd5176d4`；本地乾淨建置
提交 `42a87ae7618cee226862c690c123cb6e562edd98` 與其完整 tree 相同。
封裝 `Kaleidoscope_World_Liquor_Unofficial_0.1.118_preview1.mcaddon`
為 7166915 bytes，SHA256
`983e11fd4811ff695f26021a408168321b4069d1a26d327eeb440c7cb6beaa8f`。
後續只增加此來源／archive 審查 metadata，凍結 runtime 未變；
正式 PR 的完整來源仍須通過其本身 CI。發布與實際畫面另以各自結果為準。
