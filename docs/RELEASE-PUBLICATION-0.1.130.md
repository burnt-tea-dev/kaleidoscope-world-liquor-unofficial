# 世界名酒 0.1.130 測試版

世界名酒的重生碰撞資料保留全部 26,684 個 Java 狀態，以 block／property
domain 編碼縮至 720,833 bytes；首次查詢方塊不再掃完整狀態表。Motion 載入
及 Respawn 首用的 65,536 點 sine 全表改為計算當次所需的原量化 index，
保持 float 值、飽和與取整次序，沒有延後全表或成長 cache。

26,684 狀態的 source checker、32,230 組舊新查詢差分、65,536 sine 值及
既有 Java motion／respawn oracle 通過。SDK、配方／數量／時間、聲畫資產與
保存 schema 保持；詳見 [來源範圍](JAVA-STARTUP-20261013.md)。這些結果不能
替代 native watchdog／memory 或真人畫面驗收。

配對酒館 **0.6.153**、CI helper 燒烤 **2.8.132**。T153 保護已裝來源尚未
註冊時的外部酒桶原料，既有 batch 快照與可匹配的內建配方保持運作；G132
另保留 Java advancement 的一次性獎勵語義。各公開包由 canonical runtime
直接封裝；私有第三方來源與宿主整合不包含在公開下載。

本候選實際 CI、停服存檔副本首次／重啟、完整家族准入、LIVE 及公開下載
讀回由[家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)記錄。
`client=false`、`production_ready=false`，未使用模擬玩家；歷史證據維持原身份。
