# dot 的 Java／基岩版對照場景

本批世界名酒0.1.84配酒館0.6.117；微醺依使用者排除，其餘完整還原仍是目標。真人尚未驗收。

1. 在乾淨狀態，Java與基岩版各飲用「環遊世界」`kaleidoscope_world_liquor:around_the_world`。這項配方的crazy效果機率為100%。比較喝完後的一次信標啟動音效（volume1/pitch1.5）、原作效果圖示隱藏情況與沒有粒子。基岩版應沒有「致命中毒」或「鸚鵡螺呼吸」；Java的glowing/luck/unluck/dolphins_grace尚未完成對應，不算驗收通過。
2. 記錄喝完、停止使用與切換物品時的第一／第三人稱動作及是否有多餘文字提示；本批没有新增成功提示或輪詢文字。
3. 尖嘯原生畫面／聲音與PvP請沿用酒館docs/CLIENT-COMPARISON-0.6.116.md；本批修的是傷害callback對後續目標判定的次序，普通沒有addon callback的單次場景無法單獨證明該邏輯差异。

回返尚未修好：舊safeRespawn仍需原作床／錨／世界spawn的碰撞與metadata adapter。新增source core與26684方塊state資料是後續實作依據，沒有在本批偷偷代替真實重生邏輯。不要把部署、原生Mob probe、圖示是否存在或單次畫面相似當成全部100%還原證據。
