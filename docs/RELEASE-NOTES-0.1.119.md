# 0.1.119：保留魚類效果入口，配對完整光效修復

W119 以 canonical W118 `bd022a205a317a0fe813041dcc5b99152d07bdf5`
為基礎，只同步 own／module／payload 版本與 Tavern 0.6.142 精確相依。
完整保留 [W118 的 LivingEntity／魚類修補](RELEASE-NOTES-0.1.118.md)：
84 個精確 vanilla ID、既有 MultiJump／Tequila／instant／credit 入口，
以及 health／validity、非生物拒絕、addon Mob 適配與存活 credit 條件。
67 個三語指南、確認重生錨、配方、效果、模型、貼圖與音效不變。

T142 保留 canonical T141 板面換行／雪克杯來源辨識和最新指南，再加入
invalid-before／entityLoad／同 tick after 光效來源限制、initialSpawn
proof 消耗狀態保存及 strict recorder 完整來源／overlay 綁定。
最新 familyless-fall 場景仍在，原生契約為 first 21／restart 22。

公開配對指南仍為 223 條目／31 分類；完整家族 227 條目、G123／Cookery
helper 0.2.10 的語系接收、descriptor／registry 掛鉤與 copied helpers
保留獨立來源和驗收範圍。CI 仍固定 G122
`8002da0086544cd18c9854e7fe79e8ccb2f9f982` 的相同 entity definitions；
這不是完整 G123／私人家族准入證據。

本輪 W runtime 只有兩個 manifests 與一個 payload 身份檔改動。
先前 aura-only W118 head `c8d9506a6475522dee984f67ce5ceedac3938e6b`
及其 [CI run 37882970658](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/37882970658)
4 jobs、archive 與原身份保留，不能冒充包含新魚類修補的 W119 成功。
Canonical W118 的歷史 note、native 21／22 與驗證結果也保持原樣。

正式 archive 由乾淨凍結來源建置，兩側宿主 UUID／版本、固定 peer、
完整輸出與發布 hash 逐項核對。完整 PR CI 及配套 T142 的原生首次／
正常保存／重啟須使用這次完整來源，不改標舊報告，也不使用模擬玩家。

真正 Player、畫面／音效／輸入、Luck／Creative Flight 等既有差距、
私人完整家族、保存世界與 LIVE 均按自身證據驗收。持續部署授權保留；
`client=false`、`production_ready=false`、`live_deployment=false`。

## 固定來源

Tavern T142 審查提交 `2c378031110d6ff6e348613d4bc3c34092770ddf`，完整 Git tree
`d4c56ad7847cc4061d96e4b4f4a4d4dcaf062748`，由 integration／release request 同時固定。
後續 Tavern CI peer 提交只更新 metadata，host runtime 相同；
最終各自完整來源仍需自己的 CI／原生證據，client 與 LIVE 不預先通過。
