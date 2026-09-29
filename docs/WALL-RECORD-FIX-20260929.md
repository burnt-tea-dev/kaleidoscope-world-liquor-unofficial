# 壁掛唱片：朝向與不掉落修復

基準：main `14a0a5877a8bb6f6735582de7d8832b379aa7951`（0.1.27）。本修復不更改 manifest、依賴、包 UUID、唱片 ID、模型索引或世界中的 facing 狀態。

## 根因

- 模型和碰撞框在 +Z 貼牆側，但來源生成器又額外旋轉 180 度；視覺/點選面偏到對側，支撐方向却按 north/east/south/west 解讀。
- 放置交易保存 `record`，共用 onPlace 隨即無條件清空儲存，方塊又用空 loot table；破壞僅依賴 DP，因此沒有正確的唱片掉落。
- 原生 onBreak 後 block 可能已是空氣，必須讀事件的 brokenBlockPermutation，而不是讀空氣的 states。

## 改動

- 只修 wall_record 的渲染/碰撞旋轉為 0/270/180/90，保留四方向的支撐與既有存檔語義；全部 25 種模型一致。
- 用同一個模型索引解碼器從 permutation 取得 19 張原版唱片或 6 款皮膚共用的酒館唱片。onPlace、空手回收、失去支撐、原生破壞共用該解析結果；修復旧 DP 缺失、壞 JSON 或錯誤 ID 的可辨認唱片。不對非法模型猜測物品。
- 生存破壞掉落一張，創造/關閉 doTileDrops 不產生破壞掉落。重複回調/脚本移除不重複生成；新放置重設短期防重標記。
- 掉落/移除/寫入失敗撤回已生成物品並保留可恢復方塊；不覆寫已出現的無關方塊。空手正常回收仍使用既有背包交易。
- 延後放置重新檢查手持槽、模式、維度、牆體與目標格，避免切手或牆被移除後扣掉唱片。
- 原 Java 轉換器以相同 Git blob 移至 `_build_port_source.py`，公開入口 `tools/build_port.py` 不變；轉換完成後執行可重複的朝向校正，避免重建復發。轉換器原内容無改寫，CI 校驗 blob。

## 驗證

`node --experimental-loader ./tests/wall-record-loader.mjs --test tests/wall-record.test.mjs`：58 項回調/幾何測試。
`python tests/test_wall_record_generation.py`：3 項生成與來源保全檢查；本地 runtime-only 資料執行前兩項；完整 GitHub checkout 必須執行第三項（缺失即失敗）。

這是模擬回調及靜態幾何驗證，不是 Minecraft 客戶端或 BDS 實測。掛牆畫面、滑鼠挖掘、物品掉落位置仍需在世界副本驗收。

## 與其他 PR

本修復獨立於 #7 的依賴調整與 #8 的破壞回饋，不合併兩者或改發版版本。#8 也修改 furniture.js，整合時必須保留此處模型解碼/失敗回滾，並將其材質回饋接到成功的拆除，不能直接用舊文件覆蓋。
