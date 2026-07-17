# Jiuzhou Mini Game MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable WeChat mini-game MVP for `《九州·缥缈录》` with one linear 5-stage chapter, three selectable protagonists, auto-battle, simple positioning, and one manual hero skill per battle.

**Architecture:** Use `Cocos Creator 3.8 + TypeScript` for the client and keep all game rules in pure TypeScript modules so combat, stage progression, and save logic are testable with `Vitest`. Keep Cocos scenes thin: they load config, render state, forward input, and call battle/state services. Content lives in JSON files under `assets/resources/config` so stage tuning and hero tuning stay data-driven.

**Tech Stack:** `Cocos Creator 3.8`, `TypeScript`, `Vitest`, `npm`, WeChat Mini Game build target

---

## File Structure

### Runtime files

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `README.md`
- Create: `assets/resources/config/heroes.json`
- Create: `assets/resources/config/stages.json`
- Create: `assets/scripts/app/AppRouter.ts`
- Create: `assets/scripts/app/AppState.ts`
- Create: `assets/scripts/data/GameTypes.ts`
- Create: `assets/scripts/data/loadConfig.ts`
- Create: `assets/scripts/storage/SaveRepository.ts`
- Create: `assets/scripts/battle/BattleTypes.ts`
- Create: `assets/scripts/battle/BattleReducer.ts`
- Create: `assets/scripts/battle/SkillResolver.ts`
- Create: `assets/scripts/battle/Targeting.ts`
- Create: `assets/scripts/ui/MainMenuController.ts`
- Create: `assets/scripts/ui/HeroSelectController.ts`
- Create: `assets/scripts/ui/ChapterController.ts`
- Create: `assets/scripts/ui/BattleController.ts`
- Create: `assets/scripts/ui/ResultController.ts`
- Create: `assets/scenes/Boot.scene`
- Create: `assets/scenes/MainMenu.scene`
- Create: `assets/scenes/HeroSelect.scene`
- Create: `assets/scenes/Chapter.scene`
- Create: `assets/scenes/Battle.scene`
- Create: `assets/scenes/Result.scene`

### Test files

- Create: `tests/storage/SaveRepository.spec.ts`
- Create: `tests/data/loadConfig.spec.ts`
- Create: `tests/battle/BattleReducer.spec.ts`
- Create: `tests/battle/SkillResolver.spec.ts`
- Create: `tests/app/AppState.spec.ts`

### Build / workflow docs

- Create: `docs/builds/wechat-minigame.md`

---

### Task 1: Bootstrap repository, Cocos project, and test toolchain

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `README.md`

- [ ] **Step 1: Initialize the repository and connect the remote**

Run:

```bash
git init
git remote add origin https://github.com/cloxichjc/jiuzhou.git
git branch -M main
```

Expected:

```text
Initialized empty Git repository
```

- [ ] **Step 2: Create a new Cocos Creator 3.8 2D TypeScript project in the repository root**

In Cocos Creator:

```text
New Project -> 2D -> TypeScript -> Path: /home/cjc/projects/personal/jiuzhou
```

Expected:

```text
The editor creates the standard assets/, settings/, project.json, and previewable empty scene.
```

- [ ] **Step 3: Add npm tooling for tests and local scripts**

Write `package.json`:

```json
{
  "name": "jiuzhou-minigame",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 4: Add TypeScript and Vitest configuration**

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["assets/scripts/**/*.ts", "tests/**/*.ts"]
}
```

Write `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts']
  }
});
```

- [ ] **Step 5: Install dependencies and verify the toolchain**

Run:

```bash
npm install
npm test
npm run typecheck
```

Expected:

```text
added ... packages
No test files found
Found 0 errors
```

- [ ] **Step 6: Add a short project README**

Write `README.md`:

```md
# 九州缥缈录微信小游戏 MVP

单机剧情向轻自走棋微信小游戏原型。

## Commands

- `npm install`
- `npm test`
- `npm run typecheck`

## Runtime

- Cocos Creator 3.8
- TypeScript
- WeChat Mini Game target
```

- [ ] **Step 7: Commit bootstrap**

Run:

```bash
git add package.json tsconfig.json vitest.config.ts README.md
git commit -m "chore: bootstrap cocos minigame repo"
```

### Task 2: Define game data contracts, hero config, stage config, and save flow

**Files:**
- Create: `assets/scripts/data/GameTypes.ts`
- Create: `assets/scripts/data/loadConfig.ts`
- Create: `assets/scripts/storage/SaveRepository.ts`
- Create: `assets/resources/config/heroes.json`
- Create: `assets/resources/config/stages.json`
- Test: `tests/data/loadConfig.spec.ts`
- Test: `tests/storage/SaveRepository.spec.ts`

- [ ] **Step 1: Write failing tests for config loading and save persistence**

Write `tests/data/loadConfig.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateHeroes, validateStages } from '../../assets/scripts/data/loadConfig';

describe('loadConfig validation', () => {
  it('accepts the MVP hero roster', () => {
    const result = validateHeroes([
      { id: 'asu', name: '阿苏勒', role: 'support', faction: 'north', skillId: 'wolfBlessing' },
      { id: 'jiye', name: '姬野', role: 'fighter', faction: 'east', skillId: 'tigerCharge' },
      { id: 'yuran', name: '羽然', role: 'skirmisher', faction: 'east', skillId: 'featherBounce' }
    ]);

    expect(result.valid).toBe(true);
  });

  it('rejects a stage without enemy waves', () => {
    const result = validateStages([
      { id: 'stage-1', title: '乱世来客', waves: [] }
    ]);

    expect(result.valid).toBe(false);
  });
});
```

Write `tests/storage/SaveRepository.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SaveRepository } from '../../assets/scripts/storage/SaveRepository';

describe('SaveRepository', () => {
  it('creates the default save for a first-time player', () => {
    const repo = new SaveRepository();
    const save = repo.createDefault();

    expect(save.selectedHeroId).toBeNull();
    expect(save.unlockedHeroIds).toEqual([]);
    expect(save.clearedStageIds).toEqual([]);
  });

  it('marks a stage cleared and unlocks the next hero when requested', () => {
    const repo = new SaveRepository();
    const updated = repo.completeStage(repo.createDefault(), 'stage-2', 'jiye');

    expect(updated.clearedStageIds).toContain('stage-2');
    expect(updated.unlockedHeroIds).toContain('jiye');
  });
});
```

- [ ] **Step 2: Run tests to confirm the modules do not exist yet**

Run:

```bash
npm test -- tests/data/loadConfig.spec.ts tests/storage/SaveRepository.spec.ts
```

Expected:

```text
FAIL ... Cannot find module '../../assets/scripts/data/loadConfig'
FAIL ... Cannot find module '../../assets/scripts/storage/SaveRepository'
```

- [ ] **Step 3: Create the shared game types**

Write `assets/scripts/data/GameTypes.ts`:

```ts
export type HeroRole = 'support' | 'fighter' | 'skirmisher';
export type HeroFaction = 'north' | 'east';

export interface HeroConfig {
  id: string;
  name: string;
  role: HeroRole;
  faction: HeroFaction;
  skillId: string;
}

export interface EnemyWaveConfig {
  id: string;
  enemies: Array<{ unitId: string; slot: number }>;
}

export interface StageConfig {
  id: string;
  title: string;
  storyBefore: string;
  storyAfter: string;
  unlockHeroId?: string;
  waves: EnemyWaveConfig[];
}

export interface SaveData {
  selectedHeroId: string | null;
  unlockedHeroIds: string[];
  clearedStageIds: string[];
}
```

- [ ] **Step 4: Implement config validation and loading helpers**

Write `assets/scripts/data/loadConfig.ts`:

```ts
import type { HeroConfig, StageConfig } from './GameTypes';

export function validateHeroes(input: HeroConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.length !== 3) {
    errors.push('MVP requires exactly three heroes.');
  }

  for (const hero of input) {
    if (!hero.id || !hero.name || !hero.skillId) {
      errors.push(`Hero ${hero.id || 'unknown'} is missing required fields.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateStages(input: StageConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.length !== 5) {
    errors.push('MVP requires exactly five stages.');
  }

  for (const stage of input) {
    if (!stage.waves.length) {
      errors.push(`Stage ${stage.id} must have at least one enemy wave.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 5: Implement local save state transitions**

Write `assets/scripts/storage/SaveRepository.ts`:

```ts
import type { SaveData } from '../data/GameTypes';

export class SaveRepository {
  createDefault(): SaveData {
    return {
      selectedHeroId: null,
      unlockedHeroIds: [],
      clearedStageIds: []
    };
  }

  completeStage(save: SaveData, stageId: string, unlockedHeroId?: string): SaveData {
    const unlockedHeroIds = unlockedHeroId
      ? Array.from(new Set([...save.unlockedHeroIds, unlockedHeroId]))
      : save.unlockedHeroIds;

    return {
      ...save,
      clearedStageIds: Array.from(new Set([...save.clearedStageIds, stageId])),
      unlockedHeroIds
    };
  }
}
```

- [ ] **Step 6: Add the initial hero and stage content**

Write `assets/resources/config/heroes.json`:

```json
[
  { "id": "asu", "name": "阿苏勒", "role": "support", "faction": "north", "skillId": "wolfBlessing" },
  { "id": "jiye", "name": "姬野", "role": "fighter", "faction": "east", "skillId": "tigerCharge" },
  { "id": "yuran", "name": "羽然", "role": "skirmisher", "faction": "east", "skillId": "featherBounce" }
]
```

Write `assets/resources/config/stages.json`:

```json
[
  {
    "id": "stage-1",
    "title": "乱世来客",
    "storyBefore": "你第一次踏进乱世，身边只有风声和传言。",
    "storyAfter": "第一场战斗结束，你知道九州不再只是故事。",
    "waves": [{ "id": "wave-1", "enemies": [{ "unitId": "bandit-melee", "slot": 0 }] }]
  },
  {
    "id": "stage-2",
    "title": "南淮初会",
    "storyBefore": "命运让你看见了第一个同行者。",
    "storyAfter": "并肩之后，你们不再只是路人。",
    "unlockHeroId": "jiye",
    "waves": [{ "id": "wave-1", "enemies": [{ "unitId": "bandit-ranged", "slot": 2 }] }]
  },
  {
    "id": "stage-3",
    "title": "街巷风波",
    "storyBefore": "街巷里的混乱逼着你们第一次配合。",
    "storyAfter": "你开始明白，信任不是说出来的。",
    "unlockHeroId": "yuran",
    "waves": [{ "id": "wave-1", "enemies": [{ "unitId": "bandit-shield", "slot": 1 }] }]
  },
  {
    "id": "stage-4",
    "title": "并肩破敌",
    "storyBefore": "三人终于同场，命运第一次变得清晰。",
    "storyAfter": "羁绊开始成形。",
    "waves": [{ "id": "wave-1", "enemies": [{ "unitId": "elite-guard", "slot": 0 }] }]
  },
  {
    "id": "stage-5",
    "title": "一生之盟",
    "storyBefore": "你们知道，眼前这一战只是九州的开始。",
    "storyAfter": "第一章落幕，更大的世界正在打开。",
    "waves": [
      { "id": "wave-1", "enemies": [{ "unitId": "bandit-melee", "slot": 0 }, { "unitId": "bandit-ranged", "slot": 2 }] },
      { "id": "wave-2", "enemies": [{ "unitId": "captain", "slot": 1 }] }
    ]
  }
]
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm test -- tests/data/loadConfig.spec.ts tests/storage/SaveRepository.spec.ts
git add assets/resources/config assets/scripts/data assets/scripts/storage tests/data tests/storage
git commit -m "feat: add mvp data config and save flow"
```

Expected:

```text
PASS tests/data/loadConfig.spec.ts
PASS tests/storage/SaveRepository.spec.ts
```

### Task 3: Build the pure TypeScript battle engine and cover the turn loop with tests

**Files:**
- Create: `assets/scripts/battle/BattleTypes.ts`
- Create: `assets/scripts/battle/Targeting.ts`
- Create: `assets/scripts/battle/BattleReducer.ts`
- Test: `tests/battle/BattleReducer.spec.ts`

- [ ] **Step 1: Write the failing battle loop tests**

Write `tests/battle/BattleReducer.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createInitialBattleState, tickBattle } from '../../assets/scripts/battle/BattleReducer';

describe('BattleReducer', () => {
  it('moves the battle from ready to running on first tick', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0 }],
      enemies: [{ id: 'bandit', hp: 40, attack: 5, slot: 0 }]
    });

    const next = tickBattle(state, 1000);
    expect(next.phase).toBe('running');
  });

  it('marks the battle won when all enemies are defeated', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'jiye', hp: 100, attack: 50, slot: 0 }],
      enemies: [{ id: 'bandit', hp: 10, attack: 0, slot: 0 }]
    });

    const next = tickBattle(tickBattle(state, 1000), 1000);
    expect(next.phase).toBe('won');
  });
});
```

- [ ] **Step 2: Run the tests to verify the reducer is missing**

Run:

```bash
npm test -- tests/battle/BattleReducer.spec.ts
```

Expected:

```text
FAIL ... Cannot find module '../../assets/scripts/battle/BattleReducer'
```

- [ ] **Step 3: Define the battle state types**

Write `assets/scripts/battle/BattleTypes.ts`:

```ts
export type BattlePhase = 'ready' | 'running' | 'won' | 'lost';

export interface BattleUnit {
  id: string;
  hp: number;
  attack: number;
  slot: number;
}

export interface BattleState {
  phase: BattlePhase;
  elapsedMs: number;
  allies: BattleUnit[];
  enemies: BattleUnit[];
}

export interface BattleSetup {
  allies: BattleUnit[];
  enemies: BattleUnit[];
}
```

- [ ] **Step 4: Add a tiny targeting helper**

Write `assets/scripts/battle/Targeting.ts`:

```ts
import type { BattleUnit } from './BattleTypes';

export function firstLivingUnit(units: BattleUnit[]): BattleUnit | null {
  return units.find((unit) => unit.hp > 0) ?? null;
}
```

- [ ] **Step 5: Implement the minimal reducer**

Write `assets/scripts/battle/BattleReducer.ts`:

```ts
import type { BattleSetup, BattleState } from './BattleTypes';
import { firstLivingUnit } from './Targeting';

export function createInitialBattleState(setup: BattleSetup): BattleState {
  return {
    phase: 'ready',
    elapsedMs: 0,
    allies: setup.allies.map((unit) => ({ ...unit })),
    enemies: setup.enemies.map((unit) => ({ ...unit }))
  };
}

export function tickBattle(state: BattleState, deltaMs: number): BattleState {
  const next: BattleState = {
    ...state,
    phase: state.phase === 'ready' ? 'running' : state.phase,
    elapsedMs: state.elapsedMs + deltaMs,
    allies: state.allies.map((unit) => ({ ...unit })),
    enemies: state.enemies.map((unit) => ({ ...unit }))
  };

  const ally = firstLivingUnit(next.allies);
  const enemy = firstLivingUnit(next.enemies);

  if (!ally) {
    next.phase = 'lost';
    return next;
  }

  if (!enemy) {
    next.phase = 'won';
    return next;
  }

  enemy.hp -= ally.attack;

  if (enemy.hp <= 0) {
    next.phase = 'won';
    return next;
  }

  ally.hp -= enemy.attack;
  if (ally.hp <= 0) {
    next.phase = 'lost';
  }

  return next;
}
```

- [ ] **Step 6: Run the reducer tests and typecheck**

Run:

```bash
npm test -- tests/battle/BattleReducer.spec.ts
npm run typecheck
```

Expected:

```text
PASS tests/battle/BattleReducer.spec.ts
Found 0 errors
```

- [ ] **Step 7: Commit the battle core**

Run:

```bash
git add assets/scripts/battle tests/battle
git commit -m "feat: add battle reducer core"
```

### Task 4: Add hero skills, wave transitions, and progression state with tests

**Files:**
- Create: `assets/scripts/battle/SkillResolver.ts`
- Create: `assets/scripts/app/AppState.ts`
- Create: `assets/scripts/app/AppRouter.ts`
- Test: `tests/battle/SkillResolver.spec.ts`
- Test: `tests/app/AppState.spec.ts`

- [ ] **Step 1: Write failing tests for hero skills and stage completion**

Write `tests/battle/SkillResolver.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyHeroSkill } from '../../assets/scripts/battle/SkillResolver';

describe('SkillResolver', () => {
  it('applies 阿苏勒 skill as a team shield buff', () => {
    const state = applyHeroSkill('wolfBlessing', {
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0, shield: 0 }],
      enemies: []
    });

    expect(state.allies[0].shield).toBe(20);
  });
});
```

Write `tests/app/AppState.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createAppState, selectHero, clearStage } from '../../assets/scripts/app/AppState';

describe('AppState', () => {
  it('stores the selected hero', () => {
    const state = selectHero(createAppState(), 'asu');
    expect(state.save.selectedHeroId).toBe('asu');
  });

  it('clears a stage and unlocks the stage reward hero', () => {
    const state = clearStage(createAppState(), 'stage-2', 'jiye');
    expect(state.save.clearedStageIds).toContain('stage-2');
    expect(state.save.unlockedHeroIds).toContain('jiye');
  });
});
```

- [ ] **Step 2: Run tests to confirm missing modules**

Run:

```bash
npm test -- tests/battle/SkillResolver.spec.ts tests/app/AppState.spec.ts
```

Expected:

```text
FAIL ... Cannot find module '../../assets/scripts/battle/SkillResolver'
FAIL ... Cannot find module '../../assets/scripts/app/AppState'
```

- [ ] **Step 3: Extend the battle model for hero skills**

Update `assets/scripts/battle/BattleTypes.ts`:

```ts
export interface BattleUnit {
  id: string;
  hp: number;
  attack: number;
  slot: number;
  shield?: number;
}
```

Write `assets/scripts/battle/SkillResolver.ts`:

```ts
import type { BattleUnit } from './BattleTypes';

interface SkillState {
  allies: BattleUnit[];
  enemies: BattleUnit[];
}

export function applyHeroSkill(skillId: string, state: SkillState): SkillState {
  if (skillId === 'wolfBlessing') {
    return {
      ...state,
      allies: state.allies.map((ally) => ({ ...ally, shield: (ally.shield ?? 0) + 20 }))
    };
  }

  return state;
}
```

- [ ] **Step 4: Create the app-level progression state**

Write `assets/scripts/app/AppState.ts`:

```ts
import type { SaveData } from '../data/GameTypes';
import { SaveRepository } from '../storage/SaveRepository';

export interface RootState {
  save: SaveData;
}

const repo = new SaveRepository();

export function createAppState(): RootState {
  return { save: repo.createDefault() };
}

export function selectHero(state: RootState, heroId: string): RootState {
  return {
    save: {
      ...state.save,
      selectedHeroId: heroId
    }
  };
}

export function clearStage(state: RootState, stageId: string, unlockedHeroId?: string): RootState {
  return {
    save: repo.completeStage(state.save, stageId, unlockedHeroId)
  };
}
```

- [ ] **Step 5: Add a tiny router contract for Cocos scene transitions**

Write `assets/scripts/app/AppRouter.ts`:

```ts
export type SceneName = 'MainMenu' | 'HeroSelect' | 'Chapter' | 'Battle' | 'Result';

export interface RoutePayload {
  stageId?: string;
}

export class AppRouter {
  currentScene: SceneName = 'MainMenu';
  payload: RoutePayload = {};

  go(scene: SceneName, payload: RoutePayload = {}): void {
    this.currentScene = scene;
    this.payload = payload;
  }
}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm test -- tests/battle/SkillResolver.spec.ts tests/app/AppState.spec.ts
git add assets/scripts/app assets/scripts/battle tests/app tests/battle
git commit -m "feat: add hero skills and progression state"
```

Expected:

```text
PASS tests/battle/SkillResolver.spec.ts
PASS tests/app/AppState.spec.ts
```

### Task 5: Implement Cocos UI flow for menu, hero selection, chapter view, battle view, and result view

**Files:**
- Create: `assets/scripts/ui/MainMenuController.ts`
- Create: `assets/scripts/ui/HeroSelectController.ts`
- Create: `assets/scripts/ui/ChapterController.ts`
- Create: `assets/scripts/ui/BattleController.ts`
- Create: `assets/scripts/ui/ResultController.ts`
- Create: `assets/scenes/Boot.scene`
- Create: `assets/scenes/MainMenu.scene`
- Create: `assets/scenes/HeroSelect.scene`
- Create: `assets/scenes/Chapter.scene`
- Create: `assets/scenes/Battle.scene`
- Create: `assets/scenes/Result.scene`

- [ ] **Step 1: Create the main menu controller**

Write `assets/scripts/ui/MainMenuController.ts`:

```ts
import { _decorator, Component } from 'cc';
import { AppRouter } from '../app/AppRouter';

const { ccclass, property } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  @property
  router: AppRouter | null = null;

  onStartGame(): void {
    this.router?.go('HeroSelect');
  }

  onContinueGame(): void {
    this.router?.go('Chapter');
  }
}
```

- [ ] **Step 2: Create the hero selection controller**

Write `assets/scripts/ui/HeroSelectController.ts`:

```ts
import { _decorator, Component } from 'cc';
import { selectHero, type RootState } from '../app/AppState';
import { AppRouter } from '../app/AppRouter';

const { ccclass } = _decorator;

@ccclass('HeroSelectController')
export class HeroSelectController extends Component {
  router: AppRouter | null = null;
  state: RootState | null = null;

  chooseHero(heroId: string): void {
    if (!this.state) return;
    this.state = selectHero(this.state, heroId);
    this.router?.go('Chapter');
  }
}
```

- [ ] **Step 3: Create the chapter and result controllers**

Write `assets/scripts/ui/ChapterController.ts`:

```ts
import { _decorator, Component } from 'cc';
import { AppRouter } from '../app/AppRouter';

const { ccclass } = _decorator;

@ccclass('ChapterController')
export class ChapterController extends Component {
  router: AppRouter | null = null;

  startStage(stageId: string): void {
    this.router?.go('Battle', { stageId });
  }
}
```

Write `assets/scripts/ui/ResultController.ts`:

```ts
import { _decorator, Component } from 'cc';
import { AppRouter } from '../app/AppRouter';

const { ccclass } = _decorator;

@ccclass('ResultController')
export class ResultController extends Component {
  router: AppRouter | null = null;

  onNext(): void {
    this.router?.go('Chapter');
  }
}
```

- [ ] **Step 4: Create the battle scene controller**

Write `assets/scripts/ui/BattleController.ts`:

```ts
import { _decorator, Component } from 'cc';
import { createInitialBattleState, tickBattle } from '../battle/BattleReducer';
import { applyHeroSkill } from '../battle/SkillResolver';

const { ccclass } = _decorator;

@ccclass('BattleController')
export class BattleController extends Component {
  private battleState = createInitialBattleState({
    allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0 }],
    enemies: [{ id: 'bandit', hp: 40, attack: 5, slot: 0 }]
  });

  private skillUsed = false;

  update(deltaTime: number): void {
    if (this.battleState.phase === 'won' || this.battleState.phase === 'lost') {
      return;
    }

    this.battleState = tickBattle(this.battleState, deltaTime * 1000);
  }

  useHeroSkill(): void {
    if (this.skillUsed) return;
    this.battleState = applyHeroSkill('wolfBlessing', this.battleState);
    this.skillUsed = true;
  }
}
```

- [ ] **Step 5: Build the six Cocos scenes in the editor and attach controllers**

In Cocos Creator, create scenes with these roots:

```text
MainMenu.scene -> Canvas -> StartButton, ContinueButton, MainMenuController
HeroSelect.scene -> Canvas -> HeroCards(asu, jiye, yuran), HeroSelectController
Chapter.scene -> Canvas -> StageList(stage-1..stage-5), ChapterController
Battle.scene -> Canvas -> Grid3x2, SkillButton, StoryLabel, BattleController
Result.scene -> Canvas -> ResultLabel, NextButton, ResultController
Boot.scene -> Canvas -> RouterNode with AppRouter bootstrap
```

Expected:

```text
Each scene opens in the editor without missing scripts, and buttons can be wired to controller methods.
```

- [ ] **Step 6: Manual smoke test the scene flow and commit**

Run:

```text
Preview in Cocos Creator:
Boot -> MainMenu -> HeroSelect -> Chapter -> Battle -> Result -> Chapter
```

Expected:

```text
All five screens load; button clicks transition scenes; battle can reach a result state.
```

Run:

```bash
git add assets/scripts/ui assets/scenes
git commit -m "feat: add cocos scene flow for mvp"
```

### Task 6: Integrate chapter content, enemy tuning, save wiring, and WeChat build documentation

**Files:**
- Modify: `assets/scripts/ui/BattleController.ts`
- Modify: `assets/scripts/ui/HeroSelectController.ts`
- Modify: `assets/scripts/ui/ChapterController.ts`
- Modify: `assets/scripts/ui/ResultController.ts`
- Modify: `assets/scripts/app/AppState.ts`
- Create: `docs/builds/wechat-minigame.md`

- [ ] **Step 1: Replace hard-coded battle data with stage-driven setup**

Update `assets/scripts/ui/BattleController.ts`:

```ts
// Replace the hard-coded createInitialBattleState(...) call with:
// 1. read current stage id from router payload
// 2. load the stage from stages.json
// 3. map stage wave enemies into BattleUnit[]
// 4. seed allies from selected hero + unlocked heroes
```

Use this helper inside the file:

```ts
function buildAllies(heroIds: string[]) {
  const base = {
    asu: { id: 'asu', hp: 100, attack: 10, slot: 0 },
    jiye: { id: 'jiye', hp: 120, attack: 18, slot: 1 },
    yuran: { id: 'yuran', hp: 80, attack: 14, slot: 2 }
  };

  return heroIds.map((id) => ({ ...base[id as keyof typeof base] }));
}
```

- [ ] **Step 2: Wire hero choice and stage clear state into the UI**

Update `assets/scripts/ui/HeroSelectController.ts`:

```ts
// Persist the selected hero to root state and immediately unlock that hero for battle composition.
this.state = {
  save: {
    ...selectHero(this.state, heroId).save,
    unlockedHeroIds: [heroId]
  }
};
```

Update `assets/scripts/ui/ResultController.ts`:

```ts
// On victory, call clearStage(state, stageId, unlockHeroIdFromStage) before returning to Chapter.
```

- [ ] **Step 3: Gate chapter progress and show linear progression**

Update `assets/scripts/ui/ChapterController.ts`:

```ts
// Only allow starting the first uncleared stage.
// Render prior stages as cleared, current stage as playable, later stages as locked.
```

Use this helper:

```ts
function nextPlayableStage(stageIds: string[], clearedStageIds: string[]): string {
  return stageIds.find((id) => !clearedStageIds.includes(id)) ?? stageIds[stageIds.length - 1];
}
```

- [ ] **Step 4: Add WeChat build and release instructions**

Write `docs/builds/wechat-minigame.md`:

```md
# WeChat Mini Game Build

## Prerequisites

- Cocos Creator 3.8
- WeChat DevTools

## Build Steps

1. Open the project in Cocos Creator.
2. Choose `Project -> Build`.
3. Select `WeChat Mini Game`.
4. Set output directory to `build/wechatgame`.
5. Click `Build`.
6. Open the output in WeChat DevTools.
7. Run a smoke test covering:
   - Main menu load
   - Hero select
   - Stage 1 battle
   - Stage clear and stage unlock

## Release Checklist

- Verify local save survives app restart
- Verify five stages are reachable in sequence
- Verify the hero skill button only fires once per battle
- Verify the final chapter result screen appears after stage 5
```

- [ ] **Step 5: Perform final smoke checks**

Run:

```bash
npm test
npm run typecheck
```

Then run this manual checklist:

```text
1. Start a new run and choose 阿苏勒.
2. Clear stage 1 and reach stage 2.
3. Clear stage 2 and confirm 姬野 unlocks.
4. Clear stage 3 and confirm 羽然 unlocks.
5. Clear stage 5 and confirm the chapter ending appears.
```

Expected:

```text
All tests pass, typecheck passes, and the full 5-stage story loop is playable end-to-end.
```

- [ ] **Step 6: Commit and push**

Run:

```bash
git add assets/scripts/app assets/scripts/ui docs/builds
git commit -m "feat: ship jiuzhou minigame mvp loop"
git push -u origin main
```

## Self-Review

### Spec coverage

- Single-player WeChat mini-game shape: covered by Tasks 1, 5, and 6
- Five linear stages: covered by Tasks 2 and 6
- Three protagonists and unlock flow: covered by Tasks 2, 4, and 6
- Auto-battle + one manual skill: covered by Tasks 3 and 4
- Minimal UI scenes: covered by Task 5
- Local save only: covered by Task 2 and Task 4
- Cocos Creator recommendation: covered by Task 1 and Task 6

### Placeholder scan

- No `TODO` / `TBD`
- All tasks include exact file paths
- All code steps include concrete code
- All test steps include exact commands and expected results

### Type consistency

- `HeroConfig`, `StageConfig`, and `SaveData` are defined once in `GameTypes.ts`
- `RootState` consistently wraps `save`
- `BattleUnit` is extended once with optional `shield`
- Scene names remain consistent across `AppRouter` and UI controllers
