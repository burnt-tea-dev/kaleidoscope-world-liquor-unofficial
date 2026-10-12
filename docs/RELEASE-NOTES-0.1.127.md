# 0.1.127：有界原生 JSON 逃逸與酒館150配對

SDK 的純字串逃逸改用每塊最多 1024 UTF-16 單位的原生 JSON.stringify，保護完整 surrogate pair 邊界；大字串仍分批準備。原完整註冊封包、revision、BEGIN／ACK、重試與取消順序保留。配對 Tavern 0.6.150；Grilling 2.8.130 維持既有來源及成功驗證。

純 production 資料回歸核對原 W125 的 175 封註冊封包逐字相同。本版沒有配方、數量、時間、指南內容、模型、動畫、聲音或存檔 schema 變更。單次 V8 計時只作診斷，不宣稱 BDS watchdog 或真人效能通過。完整家族仍須本次停服一致備份、存檔副本首次載入／重啟、准入及 LIVE 讀回。

T150 移除啟動時同步重建整本 legacy 指南，Ribbits 的固定連接點來源優化位於私有 canonical compiler，完整第三方腳本不進此公開包。`client=false`、`production_ready=false`，實際部署及未完成問題由家族當前索引記錄。
