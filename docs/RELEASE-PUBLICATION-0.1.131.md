# 世界名酒 0.1.131 測試版

Foundation receiver在讀取封包內容前先篩选三個支援ID，避免為無關的
extension傳輸重複計算UTF-8長度和解析JSON。共用UTF-8計數改為直接讀取
UTF-16，保留合法pair及孤立surrogate的byte結果；非字串iterable保留原fallback。

原生profile支持啟動後傳輸存在這項重複工作，但未捕捉首次初始化尖峰。
來源Unicode oracle、三通道callback與W完整wire核對不替代本候選原生
watchdog、保存或真人驗收。完整修補範圍見[本版說明](RELEASE-NOTES-0.1.131.md)。

配對酒館 **0.6.154**，CI peer燒烤 **2.8.132**。W玩法、配方／數量／時序、
圖形／音效及保存schema保持；三個公開移植均由canonical runtime封裝，
私有料理／第三方整合不包含在公開下載。

实际CI、完整家族准入、停服存檔首次／重啟、LIVE與公開下載讀回，另由
[家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)記錄。
`client=false`、`production_ready=false`；完整Java一比一及真人聲畫／操作仍待完成。
