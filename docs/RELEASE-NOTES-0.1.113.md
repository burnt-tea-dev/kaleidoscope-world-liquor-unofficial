# 0.1.113：確認原生重生錨的出生點 metadata

W113 配對 Tavern 0.6.136，承接 W112 reviewed source
`ed78beed3204a8a9e3c3a83d48350fb0e84ba516`。新增正式原生錨互動觀察，
修正玩家已透過原生設定錨點、但 keepInventory=false 的 Respawn 因缺少
forced flag 而返回 unknown 的差距。

## 來源與行為

Mojang 1.21.1 RespawnAnchorBlock 在已充能、有效維度、個人點或維度確實
改變時，呼叫 setRespawnPosition(dimension,pos,0f,false,true)。同點重試
不覆寫 yaw／forced。來源 SHA1 與對照保存在
[respawn-anchor-source-20261009.json](../data/respawn-anchor-source-20261009.json)。

正式 before callback 捕捉已充能的下界錨及原生舊點；deferred 讀回必須
是同一錨的新出生點、原方塊與相同正數 charge，才保存 yaw=0／forced=false。
充能、取消、同點、非下界、改點／換塊、不可讀取的狀態皆不產生猜測資料。

同 tick repeat 保留首次 changed-point 觀察，所有保留事件均參與晚取消
判定；新目標、charge 變化、重生或離線會丟棄尚未确认 pending。已確認
metadata 的原 key／schema 不變，新增 observed_anchor_interaction basis。
床的 first-press 行為與既有 explicit declaration 契約保留。

成功 resolver 仍先選有效落點，再扣一次錨 charge、傳送並保留原聲音／
Hunger 順序；這不是一般死亡重生實作的重寫。舊錨或未觀察點仍可能 unknown。

## 配套保留

除 respawn-metadata.js 和版本／相依檔以外，W112 runtime 完整保留。
W110 作者新版獺祭效果數值、四款雞尾酒模型／atlas、兩張物品圖、所有配方、
聲音、冰櫃原料保存與七入口指南沒有改寫。BP/RP/module UUID 不變。

Tavern 與 Grilling 的精確來源以 .github/baseline-integration.json 為準。
Grilling 2.8.120 的 10 個 helper 定義與 G119 相同，家族合計 87 個已核對
零碰撞 helper；其 Cookery 0.2.7 descriptor 與 cuisine helper 必須成組。
沒有宣稱私人作者宿主的新組合已經驗證。

## 驗證

先重現正式 installEffects→原生 changed point→applyJavaRespawn 路徑
返回 unknown，以及同 tick repeat 蓋掉首次觀察的反例；修後定向
metadata／runtime 測試 33 項通過，跨代理複核對應三個邊界。
這些是來源與 SDK-shaped callback 測試；完整必要 CI、確切 T136/W113
零玩家 native 配對、原生 Player 互動、真人畫面和 LIVE 各有不同範圍。

本版來源與包裝必須通過自己的 CI 與 append-only freeze；W112 的成功
不能被改名為 W113 成功。現有 T134/T135 失敗、W111/W112 歷史與封裝
身分保留。新結果由本候選 PR／release metadata 記錄。

原生 Player 錨點座標／取消／重連 lifecycle、不可載入區塊、舊錨、自訂
維度，以及既有視覺、音效、Luck／outline 等效果差距仍未全部完成。
私人 BSM／world／quality 連線不可用；完整家族、停服存檔演練、LIVE
部署／讀回未執行。client=false、production_ready=false、live_deployment=false。
