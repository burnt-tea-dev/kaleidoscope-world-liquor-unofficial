# 世界名酒 0.1.124 測試版

配對酒館 **0.6.147** 的調酒 HUD200 修補，同時以燒烤 **2.8.128** 核對共享家族入口。世界名酒的玩法、配方、指南、模型及音效保持 W123 內容；本次僅同步包／模組／payload 身份及酒館精確相依。

公開 `.mcaddon` 直接封裝 canonical `runtime/BP` 與 `runtime/RP`。家族組裝及 live 安裝均使用這些相同檔案，沒有另加世界名酒本地玩法修補。相依酒館請一併更新 BP／RP；公開下載的燒烤是 2.8.128。Cookery 1.6.0 為可選料理來源，其伺服器 host API 適配屬獨立來源與審查，不夾入本包。

本版原始 [draft 來源紀錄](RELEASE-NOTES-0.1.124.md) 保留原樣；[發版核對資料](PUBLICATION-VALIDATION-0.1.124.json) 記錄實際來源與固定封裝摘要。最新完整家族、保存演練及 live 狀態以[家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)為準，舊影片及 BDS 報告保留各自原始範圍。

目前仍為 `client=false`、`production_ready=false`、`pending_client_acceptance`。來源、CI、封裝或 live 成功不代表真人畫面／操作或完整 Java 一比一已驗收。Forge 1.20.1／1.1.12 與 NeoForge 1.21.1／1.1.11 分開維護；NeoForge 26.1.2／1.1.6 的 Luck／BlockDrops／註冊適配仍未完成。完整差距見 [PARITY-MATRIX](PARITY-MATRIX.md)。
