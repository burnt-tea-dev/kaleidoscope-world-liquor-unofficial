# World Liquor PR 處置

2026-10-08 更新。比較正式 W0.1.104（`6063030da50097971f2692bdef6b7020da0011b3`）和本次修補來源，取代本頁原先以 W103 為基礎的建議。舊 PR 的有用行為須在目前版本保留；不得把舊 manifest、payload、freeze 或作者 fixture 覆蓋到新基線。本頁不表示 GitHub PR 已經關閉。

| PR / 檢視的 head | 處置 | 已保留的行為／本次完成的剩餘工作 | 核查依據 |
| --- | --- | --- | --- |
| [#46](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/46) `12738347abaeda25759b8fa0ffeb868f97331783` | 可關閉：已被現行來源承接 | 全部 HUD sibling scope、title prefix 和 typed panel 已保留；剩餘舊版本／配對資料已過時。 | `runtime/RP/ui/kt_world_liquor_effects.json` 與本次來源為同一完整 Git blob `3fb552a28dc6b9ce604c31c37c9f4e3c1f60f2a6`。 |
| [#43](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/43) `5ae1a6f90c0d4bceabe6292a9a97bd04e8234628` | 可關閉：已被現行來源承接 | 完整 HUD 修補已保留。PR 標題與舊 payload 版本並不一致，不能用標題判斷現行配對。 | 同一 HUD blob 與 #46／目前來源相同；現行 payload／配方／效果資料維持目前來源。 |
| [#37](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/37) `34cc771a2f7526c94b246e2438119b25bf10e76b` | 本次工具 backport 進入正式 remote 後關閉 | 十二短路徑和完整圖片已在 W104；剩餘 Python interpreter、UTF-8／LF 作者工具事項已選擇性移入本次工具修補。 | 十二 PNG 逐一與 current bytes 相等；`tools/texture_paths.py` 保留正規化／check；工具改動見下節。舊 Java1.1.9 union 不作發版輸入。 |
| [#36](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/36) `b30a5b04c85631a5a30dbf91b68dde22ee7c666f` | 本次工具 backport 進入正式 remote 後關閉 | `ZipInfo.create_system=3`、十二短路徑已在 W104。剩餘 Python 子程序／文字編碼與換行已移入現行工具。 | `tools/build_release.py` 固定 ZIP 平台；十二 PNG 與 PR 完整 bytes 相等；本次保留 strict baseline／append-only history／共用 release claim。 |
| [#33](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/33) `dcd395f5211c6c49f47aaff4a5423f32b57322d7` | 可關閉：有用差異已被現行來源承接 | 十二短 texture 路徑及所有引用已於 W104 修補，沒有更換原圖。舊效果修補意圖已由其後 current source adapters 承接；現行不完整的 Java parity 繼續在主矩陣追蹤。 | 十二短名 PNG 與目前檔案 bytes 完全相同；`tools/texture_paths.py`／`tools/test_texture_paths.py`；目前 Respawn、Crazy、傷害／效果 source adapters 與既有 parity 邊界保留。 |
| [#17](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/17) `48caabfd4849d8beed5432534ca943e54c7fa477` | 可關閉：舊配對已被正式配對取代 | 僅 manifest／payload 的版本與配對，沒有獨立玩法差異。 | 正式 `baseline.json`、BP/RP manifest、`.github/baseline-integration.json` 共同決定目前配對，不能匯入舊版本。 |

## 本次工具 backport 的範圍

`check_release.py` 和 `check_effect_icons.py` 的 Python 子程序使用目前 `sys.executable`，避免假設 Windows 必有獨立 `python3` 或另一個 `python`。既有 toolchain／檢查次序不變。

`build_storage_visuals.py`、`rebuild_guide.py`、`wall_record_definition.py`、`texture_paths.py` 明確讀寫 UTF-8，作者輸出固定 LF。`baseline_gate.py` 的 freeze／receipt 文字和 `build_release.py` 的 checksum 文字亦固定 UTF-8／LF；沒有改動版本佔用、歷史拒絕、runtime identity、archive content 或 receipt 的檢查語義。

執行證據：八個改動 Python 工具可解析；正式 storage／guide 作者工具重建後 `git diff --exit-code -- runtime/` 通過；`check_release.py` 的完整現行入口通過，資源檢查為 0 errors，仍保持 Tavern 七入口 guide。既有 baseline gate 11、release claim 14、wall-record generation 4、texture-path 5 個測試通過。這些是來源／工具驗證，不是本次 Windows 原生執行、BDS 或真人視覺驗收。

Respawn 的新增家族 helper 修補與上述舊 PR 無混用關係；來源與驗證範圍見 [BUGS.md](../BUGS.md) 及 [PARITY-MATRIX.md](../PARITY-MATRIX.md)。本次出包須使用新的 W 身分及固定 Tavern／Grilling peer，原有公開 release 與歷史 PR 的驗收記錄不會自動變成本次驗收。
