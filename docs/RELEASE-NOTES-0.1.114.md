# 0.1.114：保留重生錨修復，配對酒館原生重啟光效修正

W114 將 BP／RP、模組、payload identity 與宿主相依同步至 Tavern
0.6.137，保留 W113 runtime 的所有功能 bytes。W113 的確認原生錨點、
yaw=0／forced=false、repeat／取消／lifecycle 與原有成功結算均保留；
W110 新版獺祭數值、模型、圖示、配方、聲音、冰櫃及指南也保持。

T137 修復原生 entityLoad 後的 EffectAdd 載入通知被誤判為外部刷新，
清除已保存光效紀錄的問題。T136／W113 首次通過、重啟失敗的紀錄在
[前版說明](RELEASE-NOTES-0.1.113.md) 保留，不能挪作本候選的成功。
W114 沒有新增錨玩法變更，也不藉宿主相依更新宣稱新版原作全部適配。

宿主與可選 G120 的 exact peer 以 .github/baseline-integration.json
為準；G120 完整 Cookery 0.2.7 descriptor／作者 patch／copied helper
仍需成組。W113 已完成的來源／SDK 錨回歸可追溯且不變；本候選的
完整必要 CI、配套原生首次／正常停止／重啟、archive 另外確認。

## 本候選實測與來源

T137／W114 已完成新的零玩家原生首次啟動、正常停止保存與重啟，
首次 20 個案例、重啟 21 個案例全部完成。機器原料數量與完整 metadata、
三種合法 q4 酒款資料、載入光效與外部刷新交接均通過；
[完整配套證據](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/617187b05b7d2e26583470fc6d82b0f366756101/docs/native/T137-W114-20261009.json)
綁定本版凍結 pack 與 observer。這是保存／重啟及 recipient API 的實測，
不包含真人重生錨操作或私人世界遷移。

已審查的 T137 宿主來源固定為
`617187b05b7d2e26583470fc6d82b0f366756101`，其中保留 T137 完整功能
見證、成功原生記錄及 T136 失敗歷史。本版 W runtime 只改版本與宿主
相依；W113 的十層既有功能見證原封不動保留。最終 W114 CI 由本候選
PR 自行執行，不能沿用 W112 的成功標記。

可重現 archive SHA256：
`f612fa7b7b1474de84c8f6fab48967264777b1bf811e001896c60353b16907d4`。

## 尚未完成的驗收

真實 Player 錨點操作、舊／未知錨、自訂維度、客戶端倒轉與粒子、
音效／操作以及完整私人家族仍有未驗證部分。私人 BSM／world／quality
連線不可用，未執行停服演練與 LIVE 部署。client=false、
production_ready=false、live_deployment=false；持續授權不變。
