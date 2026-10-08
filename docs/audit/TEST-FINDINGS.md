# Verification classification findings

This audit did not run new suites, BDS, clients or implementation mutations. No tests were deleted. TEST-AUDIT.md is a file-level inventory; discovered case names are the declared behavior, not proof that every assertion has been exhaustively reviewed.

A: original Java/JDK oracle; A-source-expression: independently extracted JVM math; A-development: vectors on a development copy. B: executed production conservation/rollback with an independent invariant. C: a stated actual-engine scenario; a historical trace replay is not a new C run. D: paired actual-client evidence. Build/schema/reference/package checks are preconditions, not A–D completion.

Input/API fault injection is distinct from changing implementation code. Existing historical production reversion tests have their recorded scope. All newly added A/B/C tests in later phases require a discriminating implementation mutation; this report adds no test.

## 黄金向量尚未直接跑production

Source: `tests/respawn-source.test.mjs` lines 4–15.

JVM vectors對development/respawn/respawn-source.js；正式runtime respawn-adapter.js另有实现。

共用同一向量测试正式纯函数，退役重复development实现前保留原文件

## 目前输出作snapshot答案

Source: `tests/test_wall_record_generation.py` lines 14–29.

expected=committed wall record；从其旋转反推旧输出，再normalize==expected；能证normalize回写、幂等／字段保护，不能证原作朝向。

保留converter行为前置；Java方向向量与D取代视觉结论

## 历史native回放须分scope

Source: `tests/accepted-hurt-native-trace.test.mjs` lines 7–30.

读已有data JSON，Node重放到真正AcceptedHurtFeedback；SHA绑定只完整性；未启动BDS。

保留本回放作B+既有C来源，勿写新原生通过

## development与当前runtime区分

Source: `tests/elbow-native-evidence.test.mjs` lines 4–13.

imports development/elbow/source.js，并断言data.production_adapter_installed=false；有效反例，不是玩家肘击已修。

保留能力差距及反例，生产接线后另走B/C/D

## 数量无玩法意义

Source: `tools/check_release.py` lines 69–70.

bottles==18/furniture==27以及打印compiled counts只覆盖清单／预算前置，不能证明全18酒玩法。

清单降为前置；按Java真实注册项与切片逐条验收

## 发布完整性不是品質

Source: `tools/verify_release.py` lines 49–63.

SHA及逐archive entry bytes同source，report明确newBdsTest=false/clientTest=false。

保留发行完整性，报告独立栏，不计Java还原

