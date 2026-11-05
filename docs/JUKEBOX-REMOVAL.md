# 唱片機銷毀後歸還唱片

2026-11-05，W190。範圍為原版唱片機中由World Liquor保存的自訂唱片，不含掛牆唱片。

## 原作與反例

對照Mojang官方Minecraft1.21.1的[server](https://piston-data.mojang.com/v1/objects/59353fb40c36d304f2035d51e7d6e6baa98dc05c/server.jar)及[官方名稱對照](https://piston-data.mojang.com/v1/objects/03f8985492bda0afc0898465341eb0acef35f570/server.txt)，下載依官方版本資料所列大小與SHA1核對。`JukeboxBlock.onRemove`（mapped82–89）在方塊類型改變時呼叫`JukeboxBlockEntity.popOutTheItem`（56–74）；後者在伺服器取得非空唱片、移除容器內容，再直接建立一個唱片ItemEntity。此路徑不查玩家模式或doTileDrops。這是容器內容，與唱片機方塊物品的掉落分開。

W189的玩家破壞回呼卻排除Creative，爆炸回呼則排除doTileDrops=false。兩者先刪除保存記錄後未掉出唱片。正式回呼測試先重現兩個Creative失敗及一個爆炸失敗；W190移除負責來源中的這兩個錯誤條件。

## 驗證與界線

新增`tests/jukebox-removal.test.mjs`執行實際註冊的玩家破壞回呼，涵蓋Survival／Creative與doTileDrops開／關，並驗證重複事件不重發。`tests/record-audio.test.mjs`執行實際爆炸回呼，驗證關閉方塊掉落仍歸還內容、清除自己的保存列並只停止自己的音訊。新回歸已加入既有package CI入口。

保存列格式與唱片ID不變；既有新／舊保存列讀取及相關音訊來源測試沿用。未重跑已有效且未受影響的原生場景，未把舊音訊／保存結果改標為W190破壞觀察。完整ItemStack metadata、原作掉落位置／速度／pickup delay、手動取出及自動化仍由[差距矩陣](PARITY-MATRIX.md)追蹤；本次沒有宣稱補全。完整家族與停服保存驗證、部署交共同持有人。
