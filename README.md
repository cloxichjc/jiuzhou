# 九州·缥缈录 — 剧情向轻自走棋

基于 `Vite + TypeScript + Phaser 3` 的《九州·缥缈录》题材轻量自走棋 MVP。
当前章节：`南淮旧事·乱世初会`。

## 玩法

- 缥缈录人物战团：姬野（前锋）、阿苏勒（辅助）、息衍（轻骑）、羽然（远击）
- 竖屏 390x844 实时自动战斗（单位自主走位接敌）
- 招募经济（金币/人口）+ 同名三合一升星
- 五波敌人（山贼 → 流寇 → 赤牙死士 → 赤牙百夫长）
- 波后三选一奖励（单位/名物/经济）
- 九州名物（青阳战旗/苍狼血誓/殇阳冰骨）提供全局增益

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
```

## 验证命令

```bash
npm test           # vitest 逻辑层单测（战斗/合成/奖励）
npm run build      # tsc + vite build
```

## 美术与工具

美术资源全部由程序生成（水墨风，零外部素材），生成器在 `tools/artgen/`：

```bash
npm run artgen     # 重新生成 public/art/*.png（15 张）
```

截图自查（Playwright，chromium 用本机缓存）：

```bash
npm run dev &                            # 先起 dev server
.venv-pw/bin/python tools/screenshot/shoot.py     # 全流程截图
.venv-pw/bin/python tools/screenshot/fullrun.py   # 自动通关五波
```

截图输出在 `tools/screenshot/out/`。

## 技术路线说明

- 表现层代码化：UI 组件（面板/按钮/血条/墨章）全部由 `src/game/ui/theme.ts` 用 Phaser Graphics 手绘
- 战斗引擎为纯 TS（`src/game/core/`），事件带坐标，表现层只消费事件
- 早期 Cocos Creator 版本保留在 `cocos-ink-rebuild` 分支（含微信小游戏构建文档）
- 微信小游戏适配（weapp-adapter）留待玩法视觉验收后单独立项

## 设计与资料

- `docs/superpowers/specs/2026-04-13-jiuzhou-mvp-design.md`
- `docs/superpowers/research/2026-04-13-jiuzhou-world-reference.md`
- `docs/superpowers/plans/2026-04-13-jiuzhou-mvp-implementation.md`
