# 森羅酒館：世界名酒（非官方）0.1.5-preview.1

配合酒館 0.6.40-beta.1，修正附屬自有的五種木材、共十種酒櫃的莫洛托夫展示位置。普通酒櫃與窖藏酒櫃改用本體酒架專用瓶底原點模型；窖藏櫃的俯仰只由 RP 骨骼動畫負責，助手只設定世界朝向。

按原作 BottleBlockItem 接受規則補回西瓜汁，追加至附屬顯示索引 44。舊索引 0–43、莫洛托夫 25、世界名酒酒瓶索引、庫存 key、槽位順序、所有物品／方塊 ID 與 UUID 保持不變。生成器使用固定索引清單，不會因本體新增一種酒瓶而把附屬舊索引全部往後推。既有指南、配方、效果、美術與手持／投擲行為保留。

需要 Cookery 1.0.6 與 Tavern 0.6.40。先備份世界，同時更新本附屬 BP/RP；重新進入世界。无需清空酒櫃或重建世界。公開包沒有修改你的正式伺服器或私有 Cookery 重綁。

驗證包含腳本、JSON、跨包資源與依賴、指南資料、四方向的槽位矩陣、原有資產雜湊、重複生成與完整壓縮包內容。**沒有新的 BDS、Minecraft 客戶端或模擬玩家測試。** 十種木材共用兩條已檢查顯示路徑；數學吻合不能替代手機透明排序、實際位置和互動驗收，因此繼續標為 Preview。

## English

Companion to Tavern 0.6.40-beta.1. Corrects the independent World Liquor bar/cellar cabinet helpers for all five wood sets: use the host's storage-only bottom-centred Molotov model, and let only RP animate cellar pitch. Adds real watermelon-juice storage/display at appended index44, preserving every existing0–43 mapping and saved inventory ID/slot. Locks generator ordering against host additions. Existing guide, recipes, effects, art and held/thrown behavior are retained. Update both BP/RP with Cookery1.0.6 and Tavern0.6.40. Static source/asset/matrix/reproducibility checks only; no new BDS, client or simulated-player run.
