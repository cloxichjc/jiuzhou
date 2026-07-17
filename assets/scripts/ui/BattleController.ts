import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { clearStage, getAppState, setAppState } from '../app/AppState';
import { createInitialBattleState, tickBattle } from '../battle/BattleReducer';
import { applyHeroSkill } from '../battle/SkillResolver';
import type { BattleEvent, BattleUnitInput } from '../battle/BattleTypes';
import { getEnemyById, getHeroById, getStageById, loadHeroes } from '../data/loadConfig';

const { ccclass } = _decorator;

/** 主角在我方 3x2 棋盘的固定站位（后排左/前排中/后排右）。 */
const heroSlots: Record<string, number> = {
  asu: 3,
  jiye: 1,
  yuran: 5
};

export interface BattleUnitView {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  slot: number;
  alive: boolean;
  /** 苍狼祝祷减伤生效中 */
  warded: boolean;
  /** 风羽回旋减速生效中 */
  slowed: boolean;
}

function buildAllies(heroIds: string[]): BattleUnitInput[] {
  const heroes = loadHeroes();

  return heroIds
    .map((id) => heroes.find((hero) => hero.id === id))
    .filter((hero): hero is NonNullable<typeof hero> => Boolean(hero))
    .map((hero) => ({
      id: hero.id,
      hp: hero.hp,
      attack: hero.attack,
      attackIntervalMs: hero.attackIntervalMs,
      slot: heroSlots[hero.id] ?? 0
    }));
}

function buildEnemies(stageId: string, waveIndex: number): BattleUnitInput[] {
  const wave = getStageById(stageId)?.waves[waveIndex];
  if (!wave) {
    return [];
  }

  return wave.enemies
    .map((enemy) => {
      const config = getEnemyById(enemy.unitId);
      if (!config) {
        return null;
      }
      return {
        id: config.id,
        hp: config.hp,
        attack: config.attack,
        attackIntervalMs: config.attackIntervalMs,
        slot: enemy.slot
      };
    })
    .filter((unit): unit is BattleUnitInput => Boolean(unit));
}

@ccclass('BattleController')
export class BattleController extends Component {
  battleState = createInitialBattleState({ allies: [], enemies: [] });
  skillUsed = false;
  waveIndex = 0;
  currentStageId = appRouter.payload.stageId ?? 'stage-1';
  selectedSkillId = 'wolfBlessing';
  selectedHeroId = 'asu';
  private pendingEvents: BattleEvent[] = [];

  onLoad(): void {
    const save = getAppState().save;
    this.selectedHeroId = save.selectedHeroId ?? 'asu';
    const heroIds = Array.from(new Set([this.selectedHeroId, ...save.unlockedHeroIds]));
    const allies = buildAllies(heroIds);
    const enemies = buildEnemies(this.currentStageId, this.waveIndex);

    this.selectedSkillId = getHeroById(this.selectedHeroId)?.skillId ?? 'wolfBlessing';
    this.battleState = createInitialBattleState({ allies, enemies });
  }

  getStoryText(): string {
    return getStageById(this.currentStageId)?.storyBefore ?? '';
  }

  getStageTitle(): string {
    return getStageById(this.currentStageId)?.title ?? '未知关卡';
  }

  getSkillLabel(): string {
    return getHeroById(this.selectedHeroId)?.skillName ?? '英雄技能';
  }

  canUseSkill(): boolean {
    return !this.skillUsed && this.battleState.phase !== 'won' && this.battleState.phase !== 'lost';
  }

  getWaveLabel(): string {
    const stage = getStageById(this.currentStageId);
    const total = stage?.waves.length ?? 1;
    return `第 ${this.waveIndex + 1} / ${total} 波`;
  }

  private toView(units: typeof this.battleState.allies, names: Record<string, string>): BattleUnitView[] {
    return units.map((unit) => ({
      id: unit.id,
      name: names[unit.id] ?? unit.id,
      hp: Math.max(0, unit.hp),
      maxHp: unit.maxHp,
      slot: unit.slot,
      alive: unit.hp > 0,
      warded: (unit.damageReductionUntilMs ?? 0) > this.battleState.elapsedMs,
      slowed: (unit.slowedUntilMs ?? 0) > this.battleState.elapsedMs
    }));
  }

  getAlliesView(): BattleUnitView[] {
    const names = Object.fromEntries(loadHeroes().map((hero) => [hero.id, hero.name]));
    return this.toView(this.battleState.allies, names);
  }

  getEnemiesView(): BattleUnitView[] {
    const stage = getStageById(this.currentStageId);
    const names: Record<string, string> = {};
    for (const wave of stage?.waves ?? []) {
      for (const enemy of wave.enemies) {
        names[enemy.unitId] = getEnemyById(enemy.unitId)?.name ?? enemy.unitId;
      }
    }
    return this.toView(this.battleState.enemies, names);
  }

  /** 取走自上次调用以来累积的战斗事件（表现层消费）。 */
  consumeEvents(): BattleEvent[] {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    return events;
  }

  update(deltaTime: number): void {
    if (this.battleState.phase === 'won') {
      const stage = getStageById(this.currentStageId);
      const hasNextWave = this.waveIndex + 1 < (stage?.waves.length ?? 0);

      if (hasNextWave) {
        this.waveIndex += 1;
        this.battleState = createInitialBattleState({
          allies: this.battleState.allies,
          enemies: buildEnemies(this.currentStageId, this.waveIndex)
        });
        return;
      }

      const state = getAppState();
      setAppState(clearStage(state, this.currentStageId, stage?.unlockHeroId));
      appRouter.go('Result', { stageId: this.currentStageId, result: 'won' });
      return;
    }

    if (this.battleState.phase === 'lost') {
      appRouter.go('Result', { stageId: this.currentStageId, result: 'lost' });
      return;
    }

    const { state, events } = tickBattle(this.battleState, deltaTime * 1000);
    this.battleState = state;
    this.pendingEvents.push(...events);
  }

  useSkill(): void {
    if (this.skillUsed) return;
    const { state, events } = applyHeroSkill(this.selectedSkillId, this.battleState, this.selectedHeroId);
    this.battleState = state;
    this.pendingEvents.push(...events);
    this.skillUsed = true;
  }
}
