# 0.1.2-preview.1

修正 0.1.1 客戶端大量 `Missing referenced asset geometry.kwl.*` 錯誤。模型檔原本生成在未被客戶端載入的 `models/kwl/`；現在統一生成於 `models/entity/`，並新增打包檢查防止再犯。幾何 ID、方塊 ID 與現有世界資料保持不變。

此版使用酒館 0.6.36。基岩專用伺服器載入和靜態引用檢查通過後發佈；客戶端仍需實機確認模型顯示。
