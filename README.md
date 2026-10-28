# Kaleidoscope World Liquor — Bedrock 移植

這是 Java「醉世界」的非官方 Bedrock 移植。來源實作、可下載版本、伺服器安裝和真人驗收是不同狀態。

## 安裝與目前狀態

- 從 [Releases](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/releases) 取得配對 BP/RP，依該版說明安裝相符的 Tavern。不要混用不同版本的一半。
- 目前來源身份與依賴以 [baseline.json](baseline.json)／兩側 manifest 為準；精確來源配對見 [.github/baseline-integration.json](.github/baseline-integration.json)。這些檔案不代表某個伺服器已更新。
- Cookery 與 Grilling 為可選整合；單獨使用限制和既有下載的配對例外見 [安裝說明](docs/PUBLIC-DOWNLOAD-INSTALLATION-20261018.md)。
- 玩法、聲音、模型與尚未確認的差異見 [PARITY-MATRIX](docs/PARITY-MATRIX.md) 和 [BUGS](docs/BUGS.md)。CI 或 BDS 啟動不能代替真人畫面／聲音驗收。

## 開發與匯出

canonical 來源在 `runtime/BP` 和 `runtime/RP`。於乾淨、已提交的來源執行：

```sh
python3 tools/check_release.py
python3 tools/build_release.py
python3 tools/verify_release.py --development
```

建置產物在 `dist/`。素材／指南產生器會改寫 canonical 來源，不是匯出前的例行步驟。規則與所需工具見 [BASELINE-MAINTENANCE](docs/BASELINE-MAINTENANCE.md) 和 [AGENTS.md](AGENTS.md)。

[變更記錄](CHANGELOG.md)保留各版範圍；[整理前 README](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/blob/1ef4060800d36ed0966925b1655ae823f5591d33/README.md)屬歷史快照。原作與移植的授權、出處以倉庫內 LICENSE 和 attribution 文件為準。
