# 森罗酒馆：世界名酒 — 非官方 Bedrock 移植

Kaleidoscope World Liquor 的 Minecraft 基岩版移植，为酒馆增加更多酒品、配方、饮用效果与陈列家具。

[繁體中文](README.md) · **简体中文** · [English](README.en.md)

[下载 / Downloads](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/releases) · [更新记录](CHANGELOG.md)

## 功能

- 制作和品饮各地酒款，扩展 Tavern 的酿造与调酒内容。
- 使用酒瓶、酒柜与灯具布置空间。
- 在酒馆指南中查看产品配方、器具用法与效果说明。
- 可选配合 Cookery，获得部分酒品配方需要的食材。

这是仍在开发的非官方移植。Java Luck 的全局战利品效果、TreasureSense 轮廓与部分客户端效果仍有差距；详见[功能对照](docs/PARITY-MATRIX.md)。源码检查或加载测试不代表全部画面、音效及操作均已通过真人验证。

## 安装

1. 备份世界，从 **Releases** 下载 `.mcaddon`，不要把 GitHub 源码 ZIP 当成安装包。
2. 安装该版本指定的 **Tavern 精确版本**，同时启用两个 addon 的行为包（BP）和资源包（RP）；不能随意混合各仓库最新版。
3. 使用所选版本要求的 Minecraft 版本与实验设置。开发主线使用 26.60 Beta APIs，旧公开包的要求可能不同。

**Tavern 是必需依赖；Cookery 与 Grilling 不是。** 未安装 Cookery 时，依赖其食材的配方无法完成，但现有酒瓶仍可饮用和放置，指南也可使用。第三方内容需要单独获取；本下载不含第三方包或私有整合。[旧版下载依赖更正](docs/PUBLIC-DOWNLOAD-INSTALLATION-20261018.md)仅供使用历史版本时参考。

## 语言

资源文本提供 **English、简体中文、繁體中文**，并跟随 Minecraft 客户端语言；配方与产品说明使用 Tavern 的三语指南，需要在指南内另行选择语言。部分提示和玩家头颅文本仍固定语言，语言文件齐全不代表所有界面都已经翻译。

## 开发

需要 Python 3 与 Node.js。正式来源位于 [`runtime/BP`](runtime/BP/) 和 [`runtime/RP`](runtime/RP/)。在干净且已提交的工作区运行：

```sh
python3 tools/check_release.py
python3 tools/build_release.py
python3 tools/verify_release.py --development
```

构建产物位于 `dist/`。[`baseline.json`](baseline.json) 记录来源标识与依赖；开发主线可能比下载版更新。修改前请阅读 [AGENTS.md](AGENTS.md) 和[基线维护](docs/BASELINE-MAINTENANCE.md)。素材与指南生成器会修改源码，不必每次构建都运行。

## 问题报告

请提供世界名酒／Tavern／Minecraft 版本、可选配套、实验设置、复现步骤、预期及实际结果。画面和音效问题请附截图或短视频；先查看[已知问题](docs/BUGS.md)，不要公开私人世界或第三方完整资源包。

## 致谢与许可

原作：[Kaleidoscope World Liquor](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor)，作者 **ChenjdyUltra、bf_meow 及贡献者**。感谢 Tavern 的 Kaleidoscope Official Production Team／YSBB。本移植不代表原作者或 Minecraft 官方。

移植代码采用 [MIT](LICENSE-CODE)，复用的 Tavern 代码采用 [BSD-3-Clause](LICENSE-TAVERN-CODE)。现有素材的授权及例外见 [LICENSE-ASSETS](LICENSE-ASSETS) 和[来源声明](NOTICE.md)，不会因代码开源而自动变更。

最新 Java 1.1.13 Forge／1.1.12 NeoForge 包另标记 **CC BY-NC-ND 4.0**；新增素材不能直接使用先前 CC BY-NC-SA 的条款，须另行确认适用许可或作者授权。

## 2026-11-01 限定客户端检查点

[T194／W180 四侧结果](docs/CLIENT-CHECKPOINT-T194-W180-20261101.md)：16 项有界通过、第一人称右下裁切 FAIL、2 项 NOT-RUN、1 项尚未核实。不是全家族、所有设备或 Java 等价验收；历史结果保持不变。
