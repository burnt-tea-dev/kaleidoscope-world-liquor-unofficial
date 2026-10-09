# 0.1.118：承接已發布指南並修復魚類效果入口

W118 配對 **Tavern 0.6.141／Grilling 2.8.122**，直接承接已發布主線
`0ebf77ed7d302f453e75d9c56cc603e709ed226d`。保留 W117 的 67 個三語
指南條目、七入口與配套四個 AMW producer 頁面修正；公開配對 223／
完整家族 227 條目的範圍分開，沒有加入第三方私有腳本。

## 實際修復

效果權威為[官方 CF9066406](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9066406)，
NeoForge Minecraft 1.21.1、World Liquor 1.1.11，archive SHA256：

`e1f51736138bfe65ac1ce2aae2f2f3bd292dce71e2b8d2f18580a68bdea807cc`

原作 MultiJump 與 Tequila 適用所有 LivingEntity。新 gate 以 **84 個
精確 vanilla Native ID** 補回沒有 `mob` family 的魚類，使其進入既有
摔落免傷、float 傷害上限、Server instant-effect 及 accepted hurt
歸屬流程。health／validity、非生物拒絕與 addon mob 適配保留；生命值
為零不改類別，但後續 mob kill credit 仍要求存活。

本輪承接兩個 runtime helper 與兩個定向測試的精確修補。原有公式及
`effects.js` 事件順序未改；`BEHEADED_MARKER` 先寫入再取消原傷害是
作者設計。指南、作者資源、確認重生錨與宿主 aura 修補保持原範圍。

## 證據與待驗收

原修補的 source/API 回歸 **26／26、0 skip**，獨立交叉審查子集
**8／8** 通過，涵蓋完整類別投影與正式註冊回呼。這些證據仍綁定
原修補來源，不冒稱本次重新執行。

舊 trial `work/parity-t140-20261009`／`work/parity-w117-20261009` 的
[原生首次 21／重啟 22 案例](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/0818d91cdf648b9173e732bf45057da78743fa4d/docs/native/T140-W117-20261009.json)
已通過；實測來源是 T `67822848d85240640867f10d3bd6fc613262a8d1`、
W `0c311dab5b1488add7f8118bb0dca7d8302acd62`。它不是本次已發布
main W117 的內容，也不是 W118 的新結果；原 notes、history 與證據
保持各自身份。[已發布 W117 說明](RELEASE-NOTES-0.1.117.md)原文保留。

**新 T141／W118 配對原生驗證尚未執行，pending。** API `fall` 傷害
對照不等同自然墜落高度、MultiJump 跨重啟保存或真人飲用／操作。
原生 Luck、高球 Creative Flight、完整斬首／Elbow／CaptainGift 及
已列差距保持未實現或未驗收；完整家族、私人存檔、畫面音效與 LIVE
仍待驗證。維持 `client=false`、`production_ready=false`。
