# 0.1.120：生物戰鬥入口與剩餘差距整理

本修補以已發布 W119 為來源，保留 84 類 LivingEntity／魚類入口、
Tequila／double-damage、所有配方、67 個三語指南條目、作者資源與
已確認重生錨保存行為。匹配的宿主與身份以本版正式 manifest／baseline
及精確 CI source pins 為準。

原作 authority 是 NeoForge Minecraft 1.21.1、World Liquor 1.1.11、
[CF9066406](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9066406)。
`EventHandlers.onLivingIncomingDamage` 的斬首入口要求 direct LivingEntity、
目標存活且不是 bosses tag，沒有 ground-crit 的 melee／explosion 篩選。
`onLivingDamagePre` 的 Elbow 音效也要求 direct LivingEntity；只有
ground-crit 使用額外 melee 規則。

修補分開這兩種入口，容許 Native 欄位所證明的直接生物傷害，排除
projectile owner、health-bearing 非生物及斬首已死目標，保留 ground-crit
原條件與 accepted-hurt 音效交付。[來源核對](../data/combat-admission-review-20261009.json)
記錄精確作者 archive／class、方法與界線。

兩個既有定向套件共 16 個 named cases 通過，含正式註冊 callback、
LivingEntity explosion／projectile／boat／boss／dead-target，以及取消／
原生拒絕後的音效守門。這些是 source／API objects，不是模擬 Minecraft
玩家、原生引擎或真人驗收。

本版只修 admission。原 Incoming cancellation、owner-attributed 重入、
blocked-damage fallback、持續 marker、同次 drops 去重及 Player SkullOwner
仍未完成；Native direct-entity 與 Java DamageSource／事件階段仍需具體
能力證據。Luck loot、Elbow force、CaptainGift collision、Creative Flight、
outline、automation 和 26.1.2 分支沒有被猜測值或換 pin 當成已適配。

README／BUGS／PARITY 移除重複舊 current 段落，區分已部署 W119 家族的
static／BDS／保存成功與真人、原生 Player、實作差距。歷史 source、
release notes、claims 及收據不改寫；必要的 legacy recipes／SDK 副本
保持。新候選的 CI、引擎、完整家族與保存／LIVE 證據另記，
`client=false`、`production_ready=false`。
