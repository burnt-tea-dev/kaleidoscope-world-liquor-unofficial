# 0.1.116：已發布指南與重生錨修復整合

W116 配對 Tavern 0.6.139，保留已發布主線的 67 個三語指南條目，合入
已審查的下界重生錨 metadata 修補。Grilling 家族來源由
[配套提交](../.github/baseline-integration.json)精確釘選。

## 實際內容

指南正文逐 byte 等於已發布 `beda960c242b3b98a6b69e8950486ab5c6a44564`。
各頁的 ID、圖示、分類、preparations、recipeIds 與其餘全部玩法／資料
欄位等於固定 W115 `41c71180aa86be28297c767f7759298f02de1621`。Payload
整體只比主線多新版本身份；沒有改配方、效果、模型、貼圖或音效。

`respawn-metadata.js` 完整保留固定 W115 的 bytes。只有觀察到同一個
仍有正充能的下界重生錨確實設定了新的原生出生點，才記錄來源 yaw=0
與 forced=false。同 tick 同錨重複保留第一次觀察；取消、不同目標／
充能、重生及離線撤掉 pending 紀錄，既有確認資料、床與外部宣告契約
繼續保留。原生未知／原點未改／不可讀狀態不憑空宣稱確認。

配套 Tavern 功能來源固定為 `3df197150c00ef0818d2f393e365ef8a4b93d72c`；它已包含 T139 完整
來源合成、歷史見證與本版原生證據。Grilling 固定
`8002da0086544cd18c9854e7fe79e8ccb2f9f982`（2.8.122），Cookery helper
0.2.9 必須整組組裝及驗證，完整私人家族仍 pending。

## 不可變來源

主線 W113 已發布，與較早 trial W113 內容不同。Canonical history
保留主線已發布 key 原值，只加入非衝突 trial 身份與新 W116；舊 trial
commits、claims、功能見證與原生證據保持不變。
[合成紀錄](../data/main-guide-integration-20261009.json)保存雙方的
歷史雜湊、碰撞資料及逐路徑來源。Main 的 9 個功能 layers 與 trial
新增的 anchor layer 原封保留，共 10 個；没有放寬保存規則。

## 驗證

本次 storage payload projection 6 項、實際 payload 的完整歷史保存
投影、正式 `rebuild_guide.py --no-audit` 的逐 byte 冪等，以及對實際
T139 的正式 paired guide check 均通過：223 個 entries、67 個 addon
商品頁、31 個分類、216 個傳輸 packets，七入口完整。Main 指南工具
與保存紀錄逐 byte 保留；先前已成功的 anchor 定向場景沒有重複重跑。

[固定 T138／W115 的原生結果](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/d9e7bcc6dd9d00beca0bbf76f0fff50b6eca0813/docs/native/T138-W115-20261009.json)
只證明原配套。新 T139／W116 的建置、完整原生首次／保存／重啟和
canonical CI 由本候選的實際驗證結果記錄，不挪用先前版本的結果。

## 固定候選的實際首次／保存／重啟結果

T139／W116 已在 BDS 1.26.52.3 完成新的首次 20 個與重啟 21 個完整
案例，兩階段零玩家、零內容錯誤、正常保存停止。嚴格 recorder 也
通過完整來源／生成輸入／原始日誌綁定；[本版證據](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/v0.6.139-beta.1/docs/native/T139-W116-20261009.json)
保留真實結果。重啟有且只有一次 speed 載入確認，外部 800-tick 刷新
三 ticks 後為 797 並交還控制；兩阶段的一 tick 隱形均經原生倒數
2 ticks、script 等待 3 ticks 確认到期。原料數量、metadata、三種合法
q4 酒款與完整 Mob 選取皆保留。沒有 Player 操作或渲染驗收宣稱。

本次真實 packager 已通過凍結、乾淨來源與 archive 全檔驗證；
archive SHA256：`26fc4aded251d0e29bfb9876b9c3cc4d3e4c955366aecbca90a1bcc3b8f1b2e6`。
最終 canonical CI 由本候選 PR 的完整必要工作執行，與本機證據分列。

原生 Player 重生錨互動、手持與世界渲染、聲音、完整家族／存檔遷移
和私人 LIVE 仍待對應環境驗證。高球 Creative Flight、原生 Luck
掉落與其他已列效果差距保持誠實範圍。此版為測試候選：client=false、
production_ready=false、live_deployment=false，持續部署授權未變。
