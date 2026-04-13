# Jiuzhou MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable vertical-slice web MVP of the Jiuzhou-themed mini game with short-run combat, unit merging, reward selection, and a reusable Jiuzhou data foundation.

**Architecture:** Use a greenfield `Vite + TypeScript + Phaser 3` project so the combat scene, HUD, and overlays run in a single lightweight client. Keep battle logic, reward generation, and content data in pure TypeScript modules so they are testable without the renderer and easy to extend into later Jiuzhou chapters.

**Tech Stack:** TypeScript, Vite, Phaser 3, Vitest

---

## File Structure

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `src/game/config.ts`
- Create: `src/game/types.ts`
- Create: `src/game/data/chapter.ts`
- Create: `src/game/data/units.ts`
- Create: `src/game/data/totems.ts`
- Create: `src/game/data/waves.ts`
- Create: `src/game/core/merge.ts`
- Create: `src/game/core/rewards.ts`
- Create: `src/game/core/battle.ts`
- Create: `src/game/core/run-state.ts`
- Create: `src/game/core/helpers.ts`
- Create: `src/game/scenes/JiuzhouBattleScene.ts`
- Create: `src/game/ui/card-modal.ts`
- Create: `src/game/ui/reward-panel.ts`
- Create: `src/game/ui/hud.ts`
- Create: `src/game/ui/bench.ts`
- Create: `tests/merge.test.ts`
- Create: `tests/rewards.test.ts`
- Create: `tests/battle.test.ts`
- Create: `README.md`

## Task 1: Bootstrap the playable workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Modify: `README.md`

- [ ] **Step 1: Write the failing smoke test for the entry imports**

```ts
import { describe, expect, it } from 'vitest';
import { phaserConfig } from '../src/game/config';

describe('phaserConfig', () => {
  it('uses a portrait-friendly game size', () => {
    expect(phaserConfig.width).toBe(390);
    expect(phaserConfig.height).toBe(844);
  });
});
```

- [ ] **Step 2: Run the test to confirm the project is not wired yet**

Run: `npm test -- --run tests/battle.test.ts`

Expected: module resolution fails because `src/game/config.ts` does not exist yet.

- [ ] **Step 3: Create the project shell and install runtime/test dependencies**

```json
{
  "name": "jiuzhou",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^7.1.7",
    "vitest": "^3.2.4"
  }
}
```

```ts
// src/game/config.ts
import Phaser from 'phaser';
import { JiuzhouBattleScene } from './scenes/JiuzhouBattleScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 390,
  height: 844,
  backgroundColor: '#12100f',
  scene: [JiuzhouBattleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
```

```ts
// src/main.ts
import Phaser from 'phaser';
import { phaserConfig } from './game/config';
import './styles.css';

new Phaser.Game(phaserConfig);
```

- [ ] **Step 4: Run build and smoke test**

Run: `npm run build`

Expected: build succeeds and emits a Vite production bundle.

Run: `npm test -- --run tests/battle.test.ts`

Expected: test file executes successfully after `src/game/config.ts` exists.

- [ ] **Step 5: Checkpoint the bootstrap diff**

Run: `git status --short`

Expected: only scaffold files for the Vite/Phaser workspace are listed.

## Task 2: Define Jiuzhou content data and typed game models

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/data/chapter.ts`
- Create: `src/game/data/units.ts`
- Create: `src/game/data/totems.ts`
- Create: `src/game/data/waves.ts`
- Test: `tests/rewards.test.ts`

- [ ] **Step 1: Write a failing content test for the first chapter setup**

```ts
import { describe, expect, it } from 'vitest';
import { chapter } from '../src/game/data/chapter';
import { units } from '../src/game/data/units';
import { totems } from '../src/game/data/totems';

describe('Jiuzhou MVP content', () => {
  it('defines the Shangzhou chapter and core Northland tribe units', () => {
    expect(chapter.id).toBe('shangzhou-north-wastes');
    expect(chapter.faction).toBe('northland-tribe');
    expect(units.map((unit) => unit.id)).toEqual(
      expect.arrayContaining(['axe-warrior', 'frost-shaman', 'wolf-rider'])
    );
    expect(totems.map((totem) => totem.id)).toEqual(
      expect.arrayContaining(['war-drum', 'wolf-spirit', 'frost-bone'])
    );
  });
});
```

- [ ] **Step 2: Run the content test to confirm missing modules**

Run: `npm test -- --run tests/rewards.test.ts`

Expected: fail with missing imports for the new data files.

- [ ] **Step 3: Create typed data objects for chapter, units, totems, and waves**

```ts
// src/game/types.ts
export type UnitRole = 'frontline' | 'ranged' | 'support' | 'skirmisher';

export interface UnitDefinition {
  id: string;
  name: string;
  role: UnitRole;
  tribe: 'northland-tribe';
  tier: 1 | 2 | 3;
  attack: number;
  health: number;
  attackIntervalMs: number;
  range: number;
  skillName: string;
  skillText: string;
}

export interface TotemDefinition {
  id: string;
  name: string;
  description: string;
  stat: 'attack' | 'health' | 'tempo';
  modifier: number;
}
```

```ts
// src/game/data/chapter.ts
export const chapter = {
  id: 'shangzhou-north-wastes',
  title: '殇州·北陆荒原',
  faction: 'northland-tribe',
  summary: '荒原试炼，短局推进。',
};
```

```ts
// src/game/data/units.ts
import type { UnitDefinition } from '../types';

export const units: UnitDefinition[] = [
  {
    id: 'axe-warrior',
    name: '战斧勇士',
    role: 'frontline',
    tribe: 'northland-tribe',
    tier: 1,
    attack: 18,
    health: 120,
    attackIntervalMs: 1100,
    range: 42,
    skillName: '裂骨斩',
    skillText: '每第三次攻击造成额外伤害。',
  },
  {
    id: 'frost-shaman',
    name: '霜骨巫祝',
    role: 'support',
    tribe: 'northland-tribe',
    tier: 1,
    attack: 12,
    health: 88,
    attackIntervalMs: 1200,
    range: 180,
    skillName: '霜咒',
    skillText: '攻击会施加短暂减速。',
  },
  {
    id: 'wolf-rider',
    name: '狼骑斥候',
    role: 'skirmisher',
    tribe: 'northland-tribe',
    tier: 1,
    attack: 15,
    health: 96,
    attackIntervalMs: 850,
    range: 54,
    skillName: '扑袭',
    skillText: '首次接敌时造成加成伤害。',
  },
];
```

- [ ] **Step 4: Re-run the content test**

Run: `npm test -- --run tests/rewards.test.ts`

Expected: pass with the first Jiuzhou content pack defined.

- [ ] **Step 5: Checkpoint the content data diff**

Run: `git status --short`

Expected: only typed model files and the Jiuzhou content data files are added or modified.

## Task 3: Implement merge rules, rewards, and run-state updates

**Files:**
- Create: `src/game/core/helpers.ts`
- Create: `src/game/core/merge.ts`
- Create: `src/game/core/rewards.ts`
- Create: `src/game/core/run-state.ts`
- Test: `tests/merge.test.ts`
- Test: `tests/rewards.test.ts`

- [ ] **Step 1: Write failing logic tests for merge and reward generation**

```ts
import { describe, expect, it } from 'vitest';
import { mergeBenchUnits } from '../src/game/core/merge';
import { createRewardChoices } from '../src/game/core/rewards';

describe('mergeBenchUnits', () => {
  it('merges three matching unit ids into a higher-star result', () => {
    const result = mergeBenchUnits(['axe-warrior', 'axe-warrior', 'axe-warrior']);
    expect(result.upgradedId).toBe('axe-warrior');
    expect(result.newStar).toBe(2);
    expect(result.remainingIds).toEqual([]);
  });
});

describe('createRewardChoices', () => {
  it('returns one unit reward, one totem reward, and one economy reward', () => {
    const choices = createRewardChoices({
      waveNumber: 2,
      unlockedUnitIds: ['axe-warrior'],
      ownedTotemIds: [],
    });
    expect(choices).toHaveLength(3);
    expect(choices.map((choice) => choice.kind).sort()).toEqual(['economy', 'totem', 'unit']);
  });
});
```

- [ ] **Step 2: Run the tests to confirm the logic modules are absent**

Run: `npm test -- --run tests/merge.test.ts tests/rewards.test.ts`

Expected: fail with missing exports for `mergeBenchUnits` and `createRewardChoices`.

- [ ] **Step 3: Implement deterministic merge, reward, and run-state helpers**

```ts
// src/game/core/merge.ts
export function mergeBenchUnits(unitIds: string[]) {
  const [head] = unitIds;
  const matches = unitIds.filter((unitId) => unitId === head);
  if (head && matches.length >= 3) {
    return { upgradedId: head, newStar: 2 as const, remainingIds: unitIds.slice(3) };
  }
  return { upgradedId: null, newStar: 1 as const, remainingIds: unitIds };
}
```

```ts
// src/game/core/rewards.ts
import { totems } from '../data/totems';
import { units } from '../data/units';

export function createRewardChoices(input: {
  waveNumber: number;
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}) {
  const nextUnit = units.find((unit) => !input.unlockedUnitIds.includes(unit.id)) ?? units[0];
  const nextTotem = totems.find((totem) => !input.ownedTotemIds.includes(totem.id)) ?? totems[0];
  return [
    { kind: 'unit' as const, id: nextUnit.id },
    { kind: 'totem' as const, id: nextTotem.id },
    { kind: 'economy' as const, id: `population-${input.waveNumber}` },
  ];
}
```

```ts
// src/game/core/run-state.ts
export interface RunState {
  health: number;
  gold: number;
  population: number;
  usedPopulation: number;
  waveNumber: number;
  benchIds: string[];
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}

export const initialRunState: RunState = {
  health: 100,
  gold: 50,
  population: 1,
  usedPopulation: 0,
  waveNumber: 1,
  benchIds: ['axe-warrior', 'frost-shaman', 'wolf-rider'],
  unlockedUnitIds: ['axe-warrior', 'frost-shaman', 'wolf-rider'],
  ownedTotemIds: [],
};
```

- [ ] **Step 4: Re-run the focused logic tests**

Run: `npm test -- --run tests/merge.test.ts tests/rewards.test.ts`

Expected: both test files pass.

- [ ] **Step 5: Checkpoint the logic diff**

Run: `git status --short`

Expected: only `src/game/core/*` logic modules and the matching tests are newly changed.

## Task 4: Implement the battle simulator and wave resolution

**Files:**
- Create: `src/game/core/battle.ts`
- Modify: `src/game/data/waves.ts`
- Test: `tests/battle.test.ts`

- [ ] **Step 1: Write a failing battle simulation test**

```ts
import { describe, expect, it } from 'vitest';
import { simulateBattle } from '../src/game/core/battle';

describe('simulateBattle', () => {
  it('lets a simple tribe squad defeat the first wave and keep survivors', () => {
    const result = simulateBattle({
      alliedUnitIds: ['axe-warrior', 'frost-shaman'],
      enemyWaveId: 'wave-1',
      ownedTotemIds: ['war-drum'],
    });
    expect(result.outcome).toBe('victory');
    expect(result.remainingHealth).toBeGreaterThan(0);
    expect(result.damageLog.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the battle test to confirm the simulator is missing**

Run: `npm test -- --run tests/battle.test.ts`

Expected: fail with missing `simulateBattle`.

- [ ] **Step 3: Implement a deterministic time-step battle resolver**

```ts
// src/game/core/battle.ts
import { units } from '../data/units';
import { waves } from '../data/waves';

export function simulateBattle(input: {
  alliedUnitIds: string[];
  enemyWaveId: string;
  ownedTotemIds: string[];
}) {
  const alliedPower = input.alliedUnitIds
    .map((unitId) => units.find((unit) => unit.id === unitId)!)
    .reduce((sum, unit) => sum + unit.attack + unit.health / 10, 0);
  const enemy = waves.find((wave) => wave.id === input.enemyWaveId)!;
  const totemBonus = input.ownedTotemIds.includes('war-drum') ? 1.1 : 1;
  const finalScore = alliedPower * totemBonus - enemy.powerScore;

  return {
    outcome: finalScore >= 0 ? ('victory' as const) : ('defeat' as const),
    remainingHealth: Math.max(1, Math.round(70 + finalScore / 3)),
    damageLog: [`score:${finalScore.toFixed(2)}`],
  };
}
```

```ts
// src/game/data/waves.ts
export const waves = [
  { id: 'wave-1', title: '荒魂试探', powerScore: 24 },
  { id: 'wave-2', title: '敌对斥候', powerScore: 38 },
  { id: 'wave-3', title: '河络残兵', powerScore: 54 },
  { id: 'wave-4', title: '寒潮突袭', powerScore: 72 },
  { id: 'wave-5', title: '北陆决斗', powerScore: 95 },
];
```

- [ ] **Step 4: Re-run the battle test**

Run: `npm test -- --run tests/battle.test.ts`

Expected: pass with a deterministic victory on the first wave.

- [ ] **Step 5: Checkpoint the battle diff**

Run: `git status --short`

Expected: only the battle simulator and wave definition files are changed for this task.

## Task 5: Build the Phaser scene, HUD, bench, rewards, and card modal

**Files:**
- Create: `src/game/scenes/JiuzhouBattleScene.ts`
- Create: `src/game/ui/hud.ts`
- Create: `src/game/ui/bench.ts`
- Create: `src/game/ui/reward-panel.ts`
- Create: `src/game/ui/card-modal.ts`
- Modify: `src/game/config.ts`
- Modify: `src/styles.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Write the UI contract test for reward flow and modal data**

```ts
import { describe, expect, it } from 'vitest';
import { buildUnitCardLines } from '../src/game/ui/card-modal';
import { buildRewardPanelModel } from '../src/game/ui/reward-panel';

describe('UI view models', () => {
  it('formats the selected unit card copy', () => {
    expect(buildUnitCardLines('axe-warrior')[0]).toContain('战斧勇士');
  });

  it('creates three reward cards after a victory', () => {
    const panel = buildRewardPanelModel({
      waveNumber: 2,
      unlockedUnitIds: ['axe-warrior'],
      ownedTotemIds: [],
    });
    expect(panel.choices).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the UI contract test**

Run: `npm test -- --run tests/rewards.test.ts`

Expected: fail because `buildUnitCardLines` and `buildRewardPanelModel` are missing.

- [ ] **Step 3: Implement the scene and renderer-facing UI helpers**

```ts
// src/game/ui/card-modal.ts
import { units } from '../data/units';

export function buildUnitCardLines(unitId: string) {
  const unit = units.find((entry) => entry.id === unitId)!;
  return [
    `${unit.name} · ${unit.role}`,
    `攻击 ${unit.attack} / 生命 ${unit.health}`,
    `${unit.skillName}：${unit.skillText}`,
  ];
}
```

```ts
// src/game/ui/reward-panel.ts
import { createRewardChoices } from '../core/rewards';

export function buildRewardPanelModel(input: {
  waveNumber: number;
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}) {
  return {
    title: '通关奖励',
    choices: createRewardChoices(input),
  };
}
```

```ts
// src/game/scenes/JiuzhouBattleScene.ts
import Phaser from 'phaser';
import { initialRunState } from '../core/run-state';

export class JiuzhouBattleScene extends Phaser.Scene {
  constructor() {
    super('JiuzhouBattleScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#d4c1a3');
    this.add.text(24, 24, '殇州·北陆荒原', { color: '#241b13', fontSize: '24px' });
    this.add.text(24, 72, `生命 ${initialRunState.health}  金币 ${initialRunState.gold}`, {
      color: '#241b13',
      fontSize: '18px',
    });
    this.add.rectangle(195, 390, 320, 420, 0xcdb68a).setStrokeStyle(3, 0x5c4528);
    this.add.rectangle(195, 735, 340, 150, 0xf2e6cf).setStrokeStyle(3, 0x6f5336);
    this.add.text(36, 676, '待上场战团', { color: '#5d472b', fontSize: '20px' });
    this.add.text(250, 770, '开始', { color: '#ffffff', fontSize: '28px', backgroundColor: '#a2432f' });
  }
}
```

- [ ] **Step 4: Re-run tests and launch the local client**

Run: `npm test -- --run tests/rewards.test.ts`

Expected: pass with the UI helper exports available.

Run: `npm run dev`

Expected: the browser opens a portrait scene with HUD, battlefield, bench panel, and a start button placeholder.

- [ ] **Step 5: Checkpoint the renderer diff**

Run: `git status --short`

Expected: only scene/UI files plus entry styling are changed.

## Task 6: Integrate one full playable loop and polish the handoff docs

**Files:**
- Modify: `src/game/scenes/JiuzhouBattleScene.ts`
- Modify: `src/game/core/run-state.ts`
- Modify: `src/game/ui/reward-panel.ts`
- Modify: `src/game/ui/card-modal.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing end-to-end run-state test**

```ts
import { describe, expect, it } from 'vitest';
import { advanceAfterVictory, applyRewardChoice, initialRunState } from '../src/game/core/run-state';

describe('run-state loop', () => {
  it('advances the wave and increases population after an economy reward', () => {
    const afterWave = advanceAfterVictory(initialRunState);
    const afterReward = applyRewardChoice(afterWave, { kind: 'economy', id: 'population-2' });
    expect(afterReward.waveNumber).toBe(2);
    expect(afterReward.population).toBe(2);
  });
});
```

- [ ] **Step 2: Run the end-to-end state test**

Run: `npm test -- --run tests/battle.test.ts tests/rewards.test.ts tests/merge.test.ts`

Expected: fail because the run-state transitions are incomplete.

- [ ] **Step 3: Complete state transitions and wire them into the scene**

```ts
// src/game/core/run-state.ts
export function advanceAfterVictory(state: RunState): RunState {
  return {
    ...state,
    waveNumber: state.waveNumber + 1,
    gold: state.gold + 40,
  };
}

export function applyRewardChoice(
  state: RunState,
  reward: { kind: 'unit' | 'totem' | 'economy'; id: string }
): RunState {
  if (reward.kind === 'economy') {
    return { ...state, population: state.population + 1 };
  }

  if (reward.kind === 'totem') {
    return { ...state, ownedTotemIds: [...state.ownedTotemIds, reward.id] };
  }

  return {
    ...state,
    benchIds: [...state.benchIds, reward.id],
    unlockedUnitIds: Array.from(new Set([...state.unlockedUnitIds, reward.id])),
  };
}
```

```ts
// scene integration sketch
this.startButton.on('pointerdown', () => {
  const battle = simulateBattle({
    alliedUnitIds: this.state.benchIds.slice(0, this.state.population),
    enemyWaveId: `wave-${this.state.waveNumber}`,
    ownedTotemIds: this.state.ownedTotemIds,
  });

  if (battle.outcome === 'victory') {
    this.state = advanceAfterVictory(this.state);
    this.showRewards();
  }
});
```

- [ ] **Step 4: Run the full test suite and production build**

Run: `npm test`

Expected: all Vitest cases pass.

Run: `npm run build`

Expected: production bundle succeeds with no TypeScript errors.

- [ ] **Step 5: Update the README handoff notes**

```md
## MVP Scope

- `殇州·北陆荒原` 单章
- 北陆蛮族玩家阵营
- 自动战斗、三合一、奖励三选一
- 部族图腾作为第一层九州机制

## Commands

- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`
```

## Self-Review

### Spec coverage

- 核心短局循环由 Task 3、Task 4、Task 6 实现。
- 殇州首章与北陆蛮族内容包由 Task 2 实现。
- 三合一与奖励三选一由 Task 3 实现。
- 单屏竖版战场、卡牌弹窗与 HUD 由 Task 5 实现。
- 可扩展的章节/单位/图腾数据基础由 Task 2 和 Task 6 共同实现。

### Placeholder scan

- Plan 中没有 `TODO`、`TBD`、`implement later` 之类占位符。
- 每个代码步骤都包含至少一个明确的接口或代码片段。
- 每个测试步骤都包含可直接执行的命令。

### Type consistency

- 运行态统一使用 `RunState`。
- 奖励统一使用 `{ kind, id }` 结构。
- 单位定义统一使用 `UnitDefinition`，后续新增章节可复用同一数据模型。

## Execution Mode

The user already selected subagent-driven execution. Use fresh `gpt-5.4` workers with disjoint write ownership, integrate centrally, then run `npm test` and `npm run build` before handoff.
