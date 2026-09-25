
## 0.1.7-preview.1 伺服器部署與分組修復記錄（2026-09-25）

- 與酒館 0.6.44 配對安裝於實際運營伺服器（BSM local-install），依賴使用實際酒館 UUID 無需改接；39 個配方 unlock 全齊；RP 自帶 `capabilities:["pbr"]`。
- **分組圖標修復**：本包 `crafting_item_catalog.json` 向酒館既有分組（tavern_brewing／tavern_cabinets／tavern_stools／tavern_paintings）追加時只寫 `name` 未寫 `icon`；當堆疊順序使本包高於酒館時，合併覆蓋了酒館的帶圖標定義，創造選單分組失效成散列。已在伺服器側為這 4 個條目補上與酒館一致的 `icon`（BP 0.1.7→0.1.8）。**建議上游**：向既有分組追加時一併帶上 `icon`。
