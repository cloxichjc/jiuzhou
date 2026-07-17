# Cocos 场景与预览说明

> 本文已重写：UI 现在**全部由代码构建**（见 `assets/scripts/ui/*SceneBinder.ts` 与 `assets/scripts/ui/kit/`），不再需要在编辑器里手工摆放节点。

## 1. 场景结构

`assets/scenes/` 下 6 个场景由 `tools/scene-gen/generate.js` 生成（`npm run scene-gen`），结构完全一致：

```
Scene
└── Canvas (cc.Canvas + cc.UITransform + cc.Widget, 720x1280)
    ├── Camera (cc.Camera, 2D 正交)
    └── Root (挂载本场景的 *SceneBinder)
```

- 设计分辨率 720x1280 竖屏，适配方式为「适配高度」（`settings/v2/packages/project.json`）。
- 每个场景唯一的手工组件是 Root 节点上的 `*SceneBinder`；其余 UI（背景、棋盘、按钮、血条……）都是 binder 在 `onLoad` 里用代码创建的。
- 场景文件是生成的，**不要手工编辑**；结构要改就改 `tools/scene-gen/generate.js` 再重新生成。

## 2. 本地预览步骤

1. 用 Cocos Creator 3.8.8 打开项目根目录。
2. 首次打开等待资源导入完成（`assets/resources/art/*.png` 的 `.meta` 会自动生成）。
3. 双击打开 `assets/scenes/Boot.scene`，点编辑器上方 **Preview**。
4. 预期流程：Boot → 主菜单 → 主角选择 → 章节 → 战斗 → 结算 → 章节。

预览时的启动场景以编辑器当前打开的场景为准；构建微信小游戏时在构建面板把 `Boot` 设为初始场景。

## 3. 如果场景打开报错（退路）

场景 JSON 是程序生成的，个别引擎小版本可能对序列化字段更挑剔。若编辑器报格式错误，手工重建只要几分钟：

1. 新建空场景（2D），保留默认 Canvas 和 Camera。
2. 在 Canvas 下新建空节点 `Root`，挂上对应的 `*SceneBinder` 组件。
3. 另存为同名场景覆盖即可（6 个场景都这样做）。

## 4. 页面与代码对应关系

| 场景 | Binder | 说明 |
|---|---|---|
| Boot | `BootSceneBinder` | 恢复存档、绑定路由，自动进主菜单 |
| MainMenu | `MainMenuSceneBinder` | 标题、开始/继续 |
| HeroSelect | `HeroSelectSceneBinder` | 三张主角卡（立绘+介绍+技能） |
| Chapter | `ChapterSceneBinder` | 5 关进度列表，中文状态 |
| Battle | `BattleSceneBinder` | 双 3x2 棋盘、血条、攻击/技能动画、波次横幅、技能按钮 |
| Result | `ResultSceneBinder` | 胜/败墨章、总结、主按钮 |

战斗页的表现细节（事件 → 动画的映射）在 `assets/scripts/ui/BattleViewModel.ts`，纯函数，可直接看测试 `tests/ui/BattleViewModel.spec.ts`。

## 5. 美术资源

`assets/resources/art/*.png` 全部由 `tools/artgen/generate.js` 程序生成（`npm run artgen`），运行时经 `resources.load('art/<名字>/spriteFrame')` 按路径加载。想替换某张图，直接换同名 PNG 即可，代码无需改动。
