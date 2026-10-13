# 0.1.130：精簡重生資料與啟動計算

W130 將完整 26,684 個 Java 碰撞狀態按 block／property domain 編碼，runtime
catalog 縮至 720,833 bytes，避免每個首次查詢的 block 都遍歷整份狀態表。
完整命名資料仍保留 canonical development/data；碰撞、危險／流體、partial
state consensus 及未知 dynamic geometry 的拒絕規則保持。

Motion 啟動與 Respawn 首用的 65,536 點 sine 全表改成只計算所需的原量化
index，保持 float 值、飽和和取整次序，不建立延後全表或成長 cache。
全值與實際查詢差分及 Java oracle 範圍見 [來源核對](JAVA-STARTUP-20261013.md)。

版本、模組、payload 與 Tavern 0.6.153 相依同步；Grilling 2.8.131 是精確
CI 配對來源。T153 另保護已裝來源尚未註冊時的新酒桶原料，已開始的 batch
沿用原保存快照。W SDK、配方／數量／時間、聲畫資產及保存 schema 未改。

這些來源結果不代表 native watchdog 已解除，也不替代停服存檔首次／重啟、
完整家族准入、LIVE 與公開下載讀回。`client=false`、`production_ready=false`；
當前完整 Java 一比一及平台／真人差距仍保留在 PARITY-MATRIX。
