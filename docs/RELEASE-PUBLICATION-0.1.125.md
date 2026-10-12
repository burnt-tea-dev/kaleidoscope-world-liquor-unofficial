# 世界名酒 0.1.125 測試版

此包須配對酒館 **0.6.148** 的 UI namespace bridge，並以煙火 **2.8.129** 核對公開家族接口。世界名酒原本的 UI namespace 保持；只同步包／模組／payload 身份及精確相依，保留 W124 的全部玩法、指南、資產與保存資料。

公開 `.mcaddon` 直接封裝 canonical `runtime/BP` 與 `runtime/RP`；完整家族安裝須使用同一組檔案。Cookery／AMW 的私人整合能力屬獨立來源，不包含在這個公開自有包內。

namespace bridge 處理多包 UI 同路徑載入相容，沒有宣稱完整共享 Actionbar／title 仲裁或全部 UI 已修復。來源、CI、封裝、完整家族／存檔驗證及實際 LIVE 狀態分開記錄。[來源範圍](RELEASE-NOTES-0.1.125.md)與[家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)保留真正驗證邊界；`client=false`、`production_ready=false`，完整真人效果和 Java 一比一仍待驗收。
