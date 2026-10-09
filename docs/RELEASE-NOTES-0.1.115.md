# 0.1.115：保留重生錨與作者內容，配對酒館 T138

W115 更新包、模組、payload 與宿主相依身份，配對 Tavern 0.6.138。
來源前身為 `787e0774cc70ead74f15b15269bb8b31fe014aa1`；完整保留
W113／W114 的已確認下界重生錨 metadata、來源 yaw=0／forced=false、
重複／取消／重生／離線處理，以及原有結算順序。

W110 作者酒款、獺祭數值、杯子／圖示、配方、音效、冰櫃與共用指南
皆保留。本版 W runtime 不新增玩法 delta；新身份用於精確配對
T138 的原生倒數暫停與 entityLoad 光效恢復整合。

並行來源 `f73f6e7184c545cf69559305c2cd1e7b22f10a98` 的 runtime
只更新 W112→W113／T135→T136 身份，未包含本輪錨修復。它的原始
歷史仍保留在該來源，沒有覆蓋本輪既有 W113 功能見證。新的 W115
不重用任何舊內容 identity；宿主 exact source 以
`.github/baseline-integration.json` 為準，Grilling 維持 G120。

T137／W114 的成功原生保存／重啟及 T136 的失敗各自保留。本候選的
完整配套 native、必要 CI 與 archive 由自己的精確來源驗證。源碼
與 SDK-shaped 錨回歸不等於真正 Player 錨點操作；舊／未知錨、自訂
維度、客戶端畫面／音效／操作與完整私人世界仍有未驗證部分。

## 已完成的本候選驗證

已凍結的 T138／W115 在 BDS 1.26.52.3 通過首次啟動、正常停止保存與
重啟：首次 20 個案例、重啟 21 個案例完成，兩階段零玩家、零內容錯誤。
[完整配套原生證據](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/5214e24a3d4c8c99b80c869f566d006b2deb3290/docs/native/T138-W115-20261009.json)
保留凍結 pack／observer／原始日誌綁定，確認光效恢復、外部交接、
原生時計隱形到期、原料保存與 Mob 選擇；這不包含 Player 錨操作。

宿主固定為 `5214e24a3d4c8c99b80c869f566d006b2deb3290`，包含實際
T138 功能見證與原生結果。W 本版只改身份與相依，原有十層功能見證
未改寫；新的 canonical CI 由本候選 PR 執行。

可重現 archive SHA256：
`16f88a5296976af9651d1d4de5aeb30f111358742802a0aaf1b037da32d4b2d6`。

## 尚未完成的驗收

私人 BSM／quality／LIVE 世界連線不可用，未執行完整私人家族保存
演練、備份與部署讀回。client=false、production_ready=false、
live_deployment=false；既有持續授權保持有效。
