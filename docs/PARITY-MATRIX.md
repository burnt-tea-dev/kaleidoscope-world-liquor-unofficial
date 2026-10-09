# World Liquor Java／Bedrock 差距矩陣

現行發布 W120，配對 T143／G124；目前完整家族 LIVE 版本、部署與保存驗證及精確收據以 [家族索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md)為準。`client=false`、`production_ready=false`；完整 Java 一比一、原生 Player 操作和畫面音效不由載入或相同 hash 推定。

玩法 authority 為 NeoForge 1.21.1／World Liquor 1.1.11／CF9066406，Forge 1.20.1／1.1.12／CF9066402 的差異分開核對。[current-author-review](../data/current-author-review-20261009.json)記錄來源；26.1.2／CF9087098 是另行待適配分支，custom Luck／BlockDrops copying 不能替換 1.21.1 的 vanilla Luck／block reroll。L0 為來源檢視，L1 為執行的 source／API／JVM 案例，L2 為明列來源的 native 引擎場景，L3 為真人客戶端比較。舊 L2／L3 保留其原版本，不改標成當前接受。

| 項目 | 已完成與證據 | 剩餘範圍 |
|---|---|---|
| LivingEntity／魚類 admission | 84 類精確 native counterpart，health／validity／非生物與存活 credit 條件保留。L1 26 原案例；T141／W118 L2 首次 21／重啟 22 的 cod API fall 對照仍綁原來源。見 [W118](RELEASE-NOTES-0.1.118.md) | 自然墜落、全部 Player／原生效果與完整事件階段 |
| 戰鬥入口（W120） | 斬首／Elbow 分開 direct LivingEntity，斬首要求目標存活；ground-crit melee 規則不變。16 個定向案例通過。見 [來源核對](../data/combat-admission-review-20261009.json) | 不是原生 DamageSource／Incoming／Pre 的完整等價；取消、重入、fallback、marker、causal heads 與 SkullOwner 仍未完成 |
| Use／crit／Tequila／Crazy／ContinuousHeal | 原 sound cadence、float damage／chance、Tequila cap、Crazy source selection 和每 tick amp+1 heal 保留。見 [use/combat](JAVA-USE-COMBAT-0.1.74.md)、既有 combat／crazy 案例 | 原生來源／護甲／absorption／cooldown、缺失 vanilla effects、實際聲場和原生 Player；不誤把原作 heal 改慢 |
| Luck／SkullOwner | Dassai Q3–Q6 的 Luck amplifier 1／3／5／7 資料正確；一般 head registry candidate 順序已實作 | 穩定 API 缺完整 Java Luck loot attribute/context 與原生 Player head owner；資料正確不等於掉落／頭像還原 |
| Treasure Guide | source crop／ore 選取、原 block state／工具 reroll 和掉落中心已有 L1，見 [block source](JAVA-TREASURE-BLOCK-20261007.md) | mob one-tick nearby scan 缺本次死亡 drops 集合證明；player/block-entity/global loot-modifier context 與 pickup delay 未閉合 |
| Elbow | 原作 ATTACK_KNOCKBACK 和 float／LUT／ground／resistance 已有獨立 JVM 數值；已有真 airborne、buffered force 能力 L2。見 [development scope](../development/elbow/README.md) | Production attribute／charge／enchantment 與原力合成尚未接入；既有能力證據否定固定 extra impulse，不作平台完成豁免 |
| CaptainGift／movement／flight | Boating、reverse-gravity、MultiJump 有來源算術與有限 native adapter；CaptainGift 現僅 source-water 浮力 | 原作 12 格 water-fluid／AABB movement clipping、ground/fallDistance、原生 collision/input 和 Creative Flight 仍有差距 |
| Respawn／helpers | 87 個精確零碰撞 helper、Native storage API 保存場景、新確認錨 metadata 和 repeat／取消防線保留，見 [source adapter](RESPAWN-RUNTIME-SOURCE-ADAPTER.md)及 [W116](RELEASE-NOTES-0.1.116.md) | 真 Player、舊／未知錨、床、自然死亡及任意第三方 collision unknown 不自動放行 |
| Freezer state／storage | 五個 current recipe、loaded tick 時序、四槽完整 native item carrier、rollback／reanchor／legacy adoption 保留；既有有限 L1／L2 見 [W93](RELEASE-NOTES-0.1.93.md)、[W98](RELEASE-NOTES-0.1.98.md) | 任意 callback／流體／metadata／offhand／crash phases 和真玩家；既有零 input 樣本不證明非空冰櫃內容 |
| Freezer height／frost | source result-height 的 20 個 JVM cases、current freeze selection 和排程老化有有限 L1／L2，見 [W99](RELEASE-NOTES-0.1.99.md)及 [current-freezer-review](../data/current-freezer-review.json) | 原料展示僅 bounded map；全 UV／light／lid／動畫、任意附魔外觀、chunk／Player interactions 仍待比較 |
| Cabinet／furniture／wall record | 原 source slots／rotations／native metadata 和牆掛四向、取回、破壞 conservation 保留，見 [wall record](WALL-RECORD-FIX-20260929.md) | 真實點格、四向、透明、seat／waterlogging、models／animation／held view 等 L3 待接受 |
| Record audio／outlines／accelerator | 兩首原 OGG、equal-weight song 選取及 script audio cleanup adapter；guide 已明列必要平台限制 | 32-channel 限制、實際空間播放／停止；穿牆輪廓、Brew Accelerator enchantment／cooldown／operator 入口未完整適配 |
| Guide | W67 頁／三語、七入口、完整 preparations，公開 223／完整家族 227；完整 Cookery receiver 證據見家族索引 | 真人排版、鍵鼠／觸控／手柄、兩入口閱讀仍 pending |
| Forge／NeoForge26／foreign integration | current selected 18 shaker、5 freezer、25 drink records 和聲畫素材比較有來源記錄；六原 OGG 保留 | Forge event／cabinet automation／Create／Jade／SMC 尚未完整；26.1.2 branch effect registry、Luck、BlockDrops、automation 和配方另列適配 |

## 冗餘處理與歷史證據

本矩陣是現行差距的單一索引，[BUGS.md](BUGS.md)只列 open 問題與可分辨場景。舊 current W114／W115、T126／W103、85-helper 敘述不再重複成當前候選。原 release notes、source records、claims、未合併原型及原始 native／client 收據保持，沒有刪除或改名。

`legacy-freezer-recipes.js` 是舊存檔 extraction／migration 的必要入口；`content.js`／`payload.js` 分別服務 local gameplay 與 data protocol；Tavern SDK 和 84-class counterpart 的自有包副本保證獨立安裝，現有 source checks 約束其一致性。它們不是可直接刪除的 dead module。26.1.2 未註冊的七類 effects 不能用來刪掉 maintained 1.21.1 的內容。
