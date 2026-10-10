# 0.1.123：配對 Tavern T146

BP／RP 相依更新為 Tavern 0.6.146，同步包、模組、內部 BP／RP 相依及 payload 版號。公開 CI 固定 Tavern T146 已審來源 `666ce955a0ed4266950e52eb0281803f195d6014` 與既有 Grilling G125；T146 仍為 draft PR #324，本候選亦只供來源審查，不是發布或部署。

W122 的玩法、三語指南條目、配方與作者資源逐位元組保留；只改上述版本及相依 metadata，不重寫 W122 的歷史鎖，不放寬 exact dependency gate。這使 W123 能宣告 T146 的配對相依，修正 W122 仍要求 T145 的缺口。

來源檢查、完整家族組裝、原生載入／保存／重啟與真人用戶端是不同驗證層次。CI 不代表真人驗收或完整 Java 對等，`client=false`、`production_ready=false`；完整家族及存檔演練須使用本次精確配對和另行取得的其他家族來源，不能沿用 W120／W122 的結果。
