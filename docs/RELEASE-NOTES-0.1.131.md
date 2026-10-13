# 0.1.131：避免處理無關的啟動傳輸

W131同步Tavern的共用SDK修補。Foundation receiver只接受
`foundation_request`、`foundation_ack`及`effect_snapshot`三個完整ID，
其他Tavern事件在讀取message、計算byte長度與JSON解析前退出。
現有Server來源、1900-byte上限、來源識別、ACK及effect驗證保持。

共享UTF-8計數改按UTF-16 code unit讀取；合法surrogate pair仍算4 bytes，
孤立surrogate仍算3 bytes，非字串iterable維持原fallback。此修補減少計數
時逐codepoint產生字串的工作，不新增cache或延後接收／ACK。

原生profile在啟動後的傳輸階段觀察到foundation listener處理無關extension
封包與UTF-8掃描；該profile錯過首次初始化尖峰，不能證明全部watchdog原因。
Tavern的Unicode獨立oracle與callback定向案例，以及W既有完整註冊wire回歸，
用於核對來源等價；本候選的實際CI、native及LIVE結果另行記錄。

W配方、數量、時序、操作、聲畫資產與保存schema保持。版本、模組、payload
及Tavern **0.6.154** 相依同步，Grilling **2.8.132** 是精確CI peer。
完整家族仍需自身准入、停服存檔首次／重啟及部署讀回；
`client=false`、`production_ready=false`，完整Java一比一仍未完成。
