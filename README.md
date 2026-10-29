# 森羅物語：醉世界 — 非官方 Bedrock 移植

Kaleidoscope World Liquor 的 Minecraft 基岩版移植，為酒館加入更多酒品、配方、飲用效果與陳列家具。

[下載 / Downloads](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/releases) · [更新紀錄](CHANGELOG.md)

## 功能

- 製作與品飲各地酒款，擴充 Tavern 的釀造與調酒內容。
- 使用酒瓶、酒櫃與燈具布置空間。
- 在酒館指南查閱產品配方、器具用法與效果說明。
- 可選擇搭配 Cookery，取得部分酒品配方需要的食材。

這是仍在開發的非官方移植。Java Luck 的全域戰利品作用、TreasureSense 輪廓及部分客戶端效果仍有差距；見[功能對照](docs/PARITY-MATRIX.md)。來源或載入測試不代表所有畫面、音效與操作已通過真人驗證。

## 安裝

1. 備份世界，從 **Releases** 下載 `.mcaddon`，不要將原始碼 ZIP 當作安裝包。
2. 安裝該版指定的 **Tavern 精確版本**，並同時啟用兩個 addon 的 BP／RP；不能任意混搭各庫最新版。
3. 使用所選版本要求的 Minecraft 版本與實驗設定。開發主線使用 26.60 Beta APIs，較舊公開包的要求可能不同。

**Tavern 是必要相依；Cookery 與 Grilling 不是。** 沒有 Cookery 時，依賴它的食材配方不可完成，但既有酒瓶仍可飲用、放置，指南亦可使用。第三方包須另行取得，本下載不包含它們或私有整合。[舊版下載相依更正](docs/PUBLIC-DOWNLOAD-INSTALLATION-20261018.md)僅供使用歷史版本時查閱。

## 語言

資源文字提供 **English、简体中文、繁體中文**，跟隨 Minecraft 客戶端語言；配方與產品說明使用 Tavern 的三語指南，需在指南內另選語言。部分提示與玩家頭顱文字仍固定語言，不能將語言檔覆蓋當成全部介面已翻譯。

## 開發

需要 Python 3 與 Node.js。正式來源在 [`runtime/BP`](runtime/BP/) 和 [`runtime/RP`](runtime/RP/)。在乾淨、已提交的 checkout 執行：

```sh
python3 tools/check_release.py
python3 tools/build_release.py
python3 tools/verify_release.py --development
```

產物在 `dist/`。[`baseline.json`](baseline.json) 記錄來源身份與相依；開發主線可能比下載版本更新。參與修改請先讀 [AGENTS.md](AGENTS.md) 與[基線維護](docs/BASELINE-MAINTENANCE.md)。素材／指南產生器會修改來源，不是每次打包前都要執行。

## 問題回報

請提供醉世界／Tavern／Minecraft 版本、可選配套、實驗設定及重現步驟，並說明預期與實際結果。畫面、音效問題請附截圖或短片；先查看[已知問題](docs/BUGS.md)，不要公開私人世界或第三方完整包。

## 鳴謝與授權

原作：**ChenjdyUltra、bf_meow 與貢獻者**的 [Kaleidoscope World Liquor](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor)。感謝 Tavern 的 Kaleidoscope Official Production Team／YSBB；本移植不代表原作者或 Minecraft 官方。

移植程式碼採 [MIT](LICENSE-CODE)，重用的 Tavern 程式碼採 [BSD-3-Clause](LICENSE-TAVERN-CODE)。既有素材授權與個別例外見 [LICENSE-ASSETS](LICENSE-ASSETS) 及[出處聲明](NOTICE.md)，不會因程式碼開源而一併改變。

最新 Java 1.1.13 Forge／1.1.12 NeoForge 封包另標示 **CC BY-NC-ND 4.0**；新增素材不能直接沿用較早的 CC BY-NC-SA 條款，須另核適用授權或作者許可。
