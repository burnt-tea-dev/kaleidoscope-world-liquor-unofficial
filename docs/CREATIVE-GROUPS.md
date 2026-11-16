# Java 創造分頁與原序

2026-11-11 本機整合；版本固化狀態見 `baseline.json`／`release-history.json`。未發布、未部署、未執行測試，未觀察新 client 畫面。

權威輸入是本包 [data/java-creative-tabs.json](../data/java-creative-tabs.json)。它分開記錄 Forge 1.20.1 CF9217901／NeoForge 1.21.1 CF9217896 的 `ModCreativeModeTabs`，每列含 Java ID、位置、stack 狀態及現有 Bedrock ID。兩個目前維護分支均只有一個本包 tab；`displayItems` 先呼叫 `addLiquorItems`，再呼叫 `addFurnitureItems`，共61項。舊1.1.8兩頁資料不再作現行分類來源。

本包 tab 投影為 Items 內一個原生群組，使用既有 bombay_sapphire_gin_q6 圖示。酒類、飲料、設備、條件食品、家具、粉／綠吊燈與木櫃保持原序，沒有按 ID 字母或用途排序。圖示的 Java default stack 與 Bedrock q6 代表品差異記在 data；未換 ID 或製造新圖示物品。

原 Java 的 `CreativeTabEvents.addPaintingsToTabs` 另將8幅畫放進 Tavern 裝飾 tab。它們由 World Liquor 自己宣告，追加到 Tavern 原群組，使用該群組的 stepladder 圖示；Tavern 本來就是本包必要相依，沒有新增可選包硬相依。Java 反覆對同一 MASTER_MARISA anchor 插入，最終順序為 BFXM、BMT、CHEN、CHA、RABBIT、CH、DREAM、QXXY。原生 catalog 只能追加到群組尾端，無法原樣插在 MASTER_MARISA 後；這個位置差距保留，不由全域 UI 或跨包重排補丁掩蓋。

Java 的 twilight／smc 條件與最高瓶裝 stack 已逐列保留。原生 catalog 無條件查詢及任意 stack metadata；現有 port ID 保留，不聲稱已還原可選 mod 切換。不同品質與放置實作不公開。26.1.2／NeoForge 1.1.6（CF9087098）已另補官方原檔並靜態讀取：原頁52項，未列目前維護分支的7項雞尾酒及兩種吊燈，KWAS與竹葉青先後也不同；其圖示使用最高瓶裝stack。該分支仍擴展相同8幅畫。完整列表獨立保存在data，沒有混進目前1.21.1參考。

現行 `_build_port_source.py` 不再先造用途分類或按 ID 排序。既有 Tavern `tools/creative/catalog.py --root <World Liquor root> --write` 讀本包 plan，生成 catalog、可見 menu_category 與三語。`data/creative-decoration-groups.json` 僅保留給歷史摘要 consumer；現行不讀它。

[Microsoft 原生 catalog 文件](https://learn.microsoft.com/en-us/minecraft/creator/documents/craftingitemcatalogdocumentation?view=minecraft-bedrock-stable)（2026-11-10 查閱）說明四個 category、自有 item 圖示、同名群組合併與只能附加的限制。「＋不展開」尚未確診；來源重建不表示 client 症狀已解。
