# 船長的恩惠：水面移動

2026-11-05，W188來源。依據目前維護的NeoForge1.21.1／World Liquor1.1.12（CF9217896）`CaptainGiftMixinHooks.enableWaterWalking`。先前只看腳下一格源水並向上推，漏掉流動水、水浸方塊、岸邊及原作允許的其他LivingEntity。

`captain-gift.js`改用原12格：腳部所在層的3×3格，以及下層沿X方向的三格。使用流體自己的高度，不因上方同類流體而把本格改成滿格；高度與block Y相加保留Java float。水面上的單位方盒須與生物AABB向外擴0.5格相交，才把下降位移限制到最高可達水面。上升、蹲下及眼睛入水時保持原移動，不改水方塊。

既有effect tick對實際接受效果的LivingEntity呼叫此邏輯，無須掃描所有玩家。玩家的自有多段跳／反重力力道先合成，再決定水面是否仍需限制；不重算水平運動。Native API在重力／阻力後套用impulse：普通空氣使用原有重力補償，淺水一般生物量得`Y×0.8−0.02`，原生Player量得`Y×0.8−0.005`。這是選定Bedrock引擎的橋接，沒有更改Java水面規則。

## 實際驗證

W189另修正眼睛入水的水面精度。[NeoForge 1.21.1的`Entity.updateFluidOnEyes`](https://github.com/neoforged/NeoForge/blob/624c929f49920c250166e2a8df7af87f16d220ef/patches/net/minecraft/world/entity/Entity.java.patch#L151-L154)先以Java float相加block Y與流體高度，再與眼睛的double高度作嚴格比較。舊`eyesUnderWater`保留double加法，源水Y80的水面被算為80.888888895，而原作為80.888885498。眼睛恰好在原作水面時，舊判定會誤擋Captain Gift；負Y邊界亦可能反向誤判。現由入水判定本身完成同樣的float相加，沒有新增另一條水面或效果路徑。

新增來源回歸直接執行`eyesUnderWater`與`applyCaptainWaterStep`，覆蓋源水／流動水的精確邊界、負Y及恰在水面的效果接線。原31項／flow6項／restart3項維持原W188範圍，不重跑、不改標為W189原生證據；這次微小邊界的實際引擎觀察仍未新增。

- 31項定向測試通過，執行真實水面函式與effects.tick；覆蓋原12格、Java float水高、流動／下落／水浸狀態、岸邊寬度、不可讀區塊、停止條件、效果到期及自有跳躍／反重力合成。
- BDS1.26.60.6／server2.12.0-beta，QA專用gametest1.0.0-beta，開啟gametest及upcoming_creator_features。源水實際位置80.888885498，寬體同高，窄體落到80；原生Player亦停在源水原高度。這些取自首輪實際樣本；該輪隨後因流動水的空氣補償錯誤而整體失敗，不把整輪改成pass。
- 第一次定向修正後，普通生物流動水已停到80.444442749，Player仍高約0.015格。改用完全無效果的Player控制場景，明確teleport讀回小數位置，量出其液體重力；首個控制因GameTest生成位置取整而站在底部，不拿來判定液體公式。
- 最終同世界flow-verification6項及restart3項通過：普通生物及原生模擬Player停在原流動水高度、停止效果可下沉、重新施用可恢復、保存後同一原生生物身份與水面功能可恢復。兩輪正常stop／exit0，沒有內容錯誤／OOM。

可重現場景在[探針](../tests/native/captain-gift-probe.js)與[QA實體定義](../tests/native/captain-gift-actors.json)。把三個定義分別放入隔離測試包，搭配本輪正式captain-gift.js／liquid-contact.js與上述API／旗標；同一世界兩次送`/scriptevent captain_qa:run`。流動水狀態是受控輸入，每tick刷新；不是自然河流、完整客戶端或全家族驗收。

## 仍未等價

原作另外清零fallDistance並寫入onGround；本版沒有已驗證的原生寫入入口。地面旗標、普通跳躍、離開水面後摔落結算、其他addon尚未提交的力道、不同生物AI／流體物理及實際客戶端輸入仍有差距。不把水面高度通過當作完整movement／fall parity。

沒有新存檔欄位或格式；沿原效果快照及到期清理。完整家族候選、停服存檔驗證與LIVE部署各走既有流程，來源測試不等於已部署。
