# Cocos Scene Wiring Guide

这份文档对应当前仓库里的场景 binder 脚本，目标是让你在 `Cocos Creator 3.8` 里把占位代码接成可点击预览的界面。

## 1. 当前可以做到什么

当前代码已经具备这些能力：

- 路由会自动映射到 Cocos 场景切换
- 主菜单标题、副标题、继续游戏可用状态
- 主角选择页的三张角色卡数据
- 章节页的 5 关列表、状态、进度文字
- 战斗页的标题、剧情、波次、技能按钮可用状态、敌我单位列表
- 结果页的标题、总结文案、主按钮文案

你在 Cocos 里真正要挂的是这些 binder 脚本：

- `assets/scripts/ui/BootSceneBinder.ts`
- `assets/scripts/ui/MainMenuSceneBinder.ts`
- `assets/scripts/ui/HeroSelectSceneBinder.ts`
- `assets/scripts/ui/ChapterSceneBinder.ts`
- `assets/scripts/ui/BattleSceneBinder.ts`
- `assets/scripts/ui/ResultSceneBinder.ts`

这些 binder 内部已经调用逻辑 controller，并且会自动执行 `appRouter -> director.loadScene()` 的切换。

## 2. 到什么地步可以本地跑起来

你要在本地“看到游戏效果”，至少需要完成这 4 件事：

1. 用 `Cocos Creator 3.8` 打开当前项目目录
2. 在编辑器里创建真实的场景节点、按钮、文本
3. 按下面的节点命名规则，把对应的 `*SceneBinder` 挂到场景根节点
4. 把 `Boot.scene` 设为启动场景，然后点 `Preview`

也就是说：

- 现在这套代码已经能支撑逻辑、界面数据和页面跳转
- 但 `assets/scenes/*.scene` 目前还是占位文件，不是 Cocos 真正保存出来的完整场景资源
- 所以“离可视化本地运行”只差编辑器里的场景搭建

如果你现在就想本地看效果，最短路径是：

- 先把 5 个场景的节点按命名搭出来
- 每个场景根节点挂对应 binder
- 按按钮回调名绑定点击事件
- 立刻就能 `Preview`

## 3. 建议的场景结构

### `Boot.scene`

根节点建议：

- `Canvas`

组件：

- `Canvas` 或场景根节点挂 `BootSceneBinder`

用途：

- 初始化全局状态
- 自动跳到主菜单

### `MainMenu.scene`

根节点建议：

- `Canvas`
- `TitleLabel`
- `SubtitleLabel`
- `StartButton`
- `ContinueButton`

组件：

- 根节点或 `Canvas` 挂 `MainMenuSceneBinder`

绑定规则：

- `TitleLabel` 和 `SubtitleLabel` 会在加载时自动填充
- `ContinueButton.interactable` 会自动刷新
- `StartButton` 点击调用 `onStartTap()`
- `ContinueButton` 点击调用 `onContinueTap()`

### `HeroSelect.scene`

根节点建议：

- `Canvas`
- `ScreenTitle`
- `HeroList`
- `HeroCard_asu`
- `HeroCard_jiye`
- `HeroCard_yuran`

每张角色卡建议包含：

- `NameLabel`
- `SummaryLabel`
- `SkillLabel`
- `SelectButton`
- `SelectedBadge`

组件：

- 根节点挂 `HeroSelectSceneBinder`

绑定规则：

- `ScreenTitle` 和三张角色卡文本会自动填充
- `SelectedBadge.active` 会自动刷新
- 每张卡的按钮点击调用 `onSelectHero()`
- 给按钮的 `CustomEventData` 依次填 `asu`、`jiye`、`yuran`

### `Chapter.scene`

根节点建议：

- `Canvas`
- `ScreenTitle`
- `ProgressLabel`
- `StageList`
- `StageCard_1` 到 `StageCard_5`

每张关卡卡片建议包含：

- `TitleLabel`
- `StoryLabel`
- `StatusLabel`
- `PlayButton`

组件：

- 根节点挂 `ChapterSceneBinder`

绑定规则：

- `ScreenTitle`、`ProgressLabel`、5 张关卡卡片会自动填充
- `StatusLabel` 显示 `cleared / playable / locked`
- 只有 `playable` 状态的按钮会自动设为可点击
- 每张 `PlayButton` 点击调用 `onPlayStage()`
- 给按钮的 `CustomEventData` 分别填 `stage-1` 到 `stage-5`

### `Battle.scene`

根节点建议：

- `Canvas`
- `StageTitle`
- `StoryText`
- `WaveLabel`
- `SkillButton`
- `SkillButtonLabel`
- `AlliesPanel`
- `EnemiesPanel`

敌我双方都可先做成最简单列表：

- `Unit_1`
- `Unit_2`
- `Unit_3`

每个单位节点先只放：

- `NameLabel`
- `HpLabel`

组件：

- 根节点挂 `BattleSceneBinder`

绑定规则：

- `StageTitle`、`StoryText`、`WaveLabel`、`SkillButtonLabel` 会自动刷新
- `SkillButton.interactable` 会自动刷新
- `SkillButton` 点击调用 `onUseSkillTap()`
- `AlliesPanel/Unit_1..3` 和 `EnemiesPanel/Unit_1..3` 会自动填充
- `HpLabel` 直接显示当前数值
- 没有单位的槽位会自动隐藏

说明：

- 当前阶段先不做真正动画
- 只要能看到数值变化和页面跳转，就足够验证 MVP

### `Result.scene`

根节点建议：

- `Canvas`
- `ResultTitle`
- `SummaryLabel`
- `PrimaryButton`
- `PrimaryButtonLabel`

组件：

- 根节点挂 `ResultSceneBinder`

绑定规则：

- `ResultTitle`、`SummaryLabel`、`PrimaryButtonLabel` 会自动填充
- 点击调用 `onPrimaryTap()`

## 4. 推荐的最小预览顺序

先不要追求美术，按下面顺序接：

1. `Boot.scene` 能自动进 `MainMenu.scene`
2. 主菜单两个按钮能跳
3. 主角选择能进入章节页
4. 章节页能点第一关进入战斗
5. 战斗页能显示标题、波次、技能按钮
6. 战斗结束能进入结果页
7. 结果页能返回章节或失败重试

## 5. 什么时候算“能在本地看效果”

满足下面条件就可以：

1. 五个场景都已经在 Cocos 里真实创建出来
2. 每个场景根节点都挂好对应 `*SceneBinder`
3. 文档里提到的节点名和按钮回调都已接好
4. `Boot.scene` 设为启动场景

做到这里，你就已经可以在本地点 `Preview` 看到：

- 启动后自动进主菜单
- 从主菜单进入主角选择
- 选主角进入章节页
- 点第一关进入战斗
- 自动战斗并手动点一次技能
- 结算后回到章节或失败重试

做到这里，你就已经能在本地看见一个完整可跑的原型了。

## 5. 下一步最值得补的东西

在接完场景以后，优先继续做这几项：

- 战斗页里的单位血量刷新
- 敌我单位的简易站位布局
- 主角卡片的小立绘和阵营标签
- 章节页的解锁态视觉区分
- 结果页的胜败视觉反馈

这些完成后，原型就会从“能跑”进入“能看懂、能试玩”的阶段。
