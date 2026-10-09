# 0.1.110：精確配對 Tavern 0.6.133

World Liquor 0.1.110 配對 Tavern 0.6.133 的原料保存、機器操作、狀態
粒子與板面／酒液視覺修復，保留 T132／L109 的濺射、雙手交易、指南
動畫與既有 G119 helper 修補。可選 Grilling 維持 2.8.119。

| 套件 | 自有 UUID／版本 | Tavern 依賴 |
| --- | --- | --- |
| BP | `355ffdfc-50e6-5a33-a126-4d78ab955b2b`／`0.1.110` | `f54f37f9-485a-55bf-8f89-6558aca988c5`／`0.6.133` |
| RP | `a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8`／`0.1.110` | `c2990d50-2cf7-59f7-886a-0f2d0240d156`／`0.6.133` |

本庫 runtime 變更只有 BP／RP、module、payload 的版本與配對欄位；
payload body、配方、效果、保存及素材均保留。BP 的自有 RP 相依同步
0.1.110；引擎與 stable Script API 契約不變。七入口指南仍由 Tavern
共用內容提供。這次版本前進是必要的精確依賴更新，不宣稱 World Liquor
新增整套 Java 功能。

Tavern 現有共享 geometry gate 為本次兩個精確 visual mesh 路徑增加
來源見證配額，仍限制未分配 base geometry 小於 1024，保留 T131 四個
source item meshes 的舊配額。未知 ID、來源、檔案移位、重複 owner 或
超出單面矩形／骨骼／cube 配額仍拒絕；它是專案預算，非引擎限額。

`.github/baseline-integration.json` 和 release request 在交付前固定
包含完整工具與 witness 的同一個 Tavern 提交；可選 Grilling 固定
`b010ec2a6709ada74ed96ead19c60da4e0bc2789`。本庫 canonical CI 執行
必要來源／依賴／包檢查。Tavern 的 paired native-persistence lane
使用完整 T133／L110，驗證真實 addon registration、指定原生保存與
效果生命週期，再正常停止及重啟，結果保留在該精確 CI 提交的 artifacts。

原生載入不是實際玩家輸入、渲染、音效、完整私人家族或 LIVE 保存世界
驗收。現行穿牆輪廓、相機及其他原生適配限制仍按各庫 parity matrix
維護；不重標舊測試結果。保持 client pending、production_ready=false、
live_deployment=false。既有持續 LIVE 授權有效，部署仍需要真實連線與
完整家族／保存演練／備份／准入／讀回，不能由本次相依更新推定完成。
