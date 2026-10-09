# 0.1.109：配對酒館 0.6.132

World Liquor 的 BP、RP、module、package 與共享 payload 身分一起前進至
**0.1.109**，兩側精確依賴 **Tavern 0.6.132**。本批是配套更新；原本的
配方、效果、保存、素材與 G119 已核對 helper 行為保持不變。

| 包 | 本包 UUID／版本 | 酒館相依 |
| --- | --- | --- |
| BP | `355ffdfc-50e6-5a33-a126-4d78ab955b2b`／0.1.109 | `f54f37f9-485a-55bf-8f89-6558aca988c5`／0.6.132 |
| RP | `a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8`／0.1.109 | `c2990d50-2cf7-59f7-886a-0f2d0240d156`／0.6.132 |

BP 對本包 RP 的相依也為 0.1.109；原有 UUID 和穩定 Script API 要求保留。
Grilling G119 `b010ec2a6709ada74ed96ead19c60da4e0bc2789` 仍為可選同族包，
沒有新增硬性依賴。七入口與共用附屬指南契約保留。

T132 修復濺射瞬時效果／免疫政策、雪克杯原生持物回補／空手 echo／失敗
重試、原生容器回滾、感知類別及查詢順序、指南圖示動畫、板面 escape 和
HUD 尾巴。完整範圍及尚未一比一的部分見
[T132 版本說明](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/docs/RELEASE-NOTES-0.6.132.md)。

兩庫 CI 使用 `.github/baseline-integration.json` 與酒館 workflow 的不可變
配套提交。World Liquor 既有完整驗證必須對本批 PR 成功；Tavern 的完整
T132／L109 原生首次／正常重啟場景核對真正的 World Liquor descriptor
註冊，並執行原生物品保存、濺射和感知觀察。特殊 impact envelope 為測試
observer 輸入，不是真玩家或物理碰撞；包複製完成後先與 frozen runtime
比對，再記錄測試 overlay。實際結果由本批 CI 記錄，沒有預先宣告通過。

發布請求維持 prerelease，核對確切 ZIP 和上傳後讀回。舊版原生成功不改寫
為 W109 驗收。完整私人家族、真實停服保存世界、真人視覺／聲音／操作與
LIVE 仍為獨立門檻；保持 `client=false`、`production_ready=false`、
`live_deployment=false`。既有使用者部署授權有效，待實際 BSM／世界連線
完成正常家族准入、備份、演練與精確包部署。
