# 0.1.128：配對酒館151的原生物品定義快取

本版只更新 World Liquor 的包／模組／payload 身份及 Tavern 0.6.151 相依。T151 在同次啟動重用已成功的原生 ItemTypes 查詢；未知項與查詢錯誤照常重試，純 Registry 呼叫者不套用此快取。來源查詢減少不等於原生啟動或客戶端效能驗收。

W127 的有界原生 JSON、SDK、配方、數量、時間、指南、模型、動畫、聲音、存檔 schema 與既有修復保持。G130／private-integration／Ribbits1.0.10036 不變。沒有延後註冊或新增分片 COMMIT；原 BEGIN／ACK、重試、取消與互動時序保持。

T150／G130／W127 已部署且公開六份自有包的9,344檔與 LIVE 相同；這份原證據不能改寫為 W128 成功。本候選尚待實際 CI、一次停服存檔副本首次載入／重啟、完整家族准入與部署讀回。`client=false`、`production_ready=false`；remaining watchdog／畫面回歸由家族當前索引分列。
