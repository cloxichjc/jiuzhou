import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { clearStage, getAppState, setAppState } from '../app/AppState';
import { createInitialBattleState, tickBattle } from '../battle/BattleReducer';
import { applyHeroSkill } from '../battle/SkillResolver';
import type { BattleUnit } from '../battle/BattleTypes';
import { getStageById, loadHeroes } from '../data/loadConfig';

const { ccclass } = _decorator;

const heroSkillLabels: Record<string, string> = {
  wolfBlessing: '苍狼祝祷',
  tigerCharge: '虎牙破阵',
  featherBounce: '风羽回旋'
};

function buildAllies(heroIds: string[]): BattleUnit[] {
  const base: Record<string, BattleUnit> = {
    asu: { id: 'asu', hp: 100, attack: 10, slot: 0 },
    jiye: { id: 'jiye', hp: 120, attack: 18, slot: 1 },
    yuran: { id: 'yuran', hp: 80, attack: 14, slot: 2 }
  };

  return heroIds.map((id) => ({ ...base[id] })).filter(Boolean);
}

function buildEnemies(stageId: string, waveIndex: number): BattleUnit[] {
  const stage = getStageById(stageId);
  const wave = stage?.waves[waveIndex];
  if (!wave) {
    return [];
  }

  const stats: Record<string, Omit<BattleUnit, 'slot'>> = {
    'bandit-melee': { id: 'bandit-melee', hp: 45, attack: 6 },
    'bandit-ranged': { id: 'bandit-ranged', hp: 30, attack: 8 },
    'bandit-shield': { id: 'bandit-shield', hp: 60, attack: 4 },
    'elite-guard': { id: 'elite-guard', hp: 70, attack: 10 },
    captain: { id: 'captain', hp: 110, attack: 14 }
  };

  return wave.enemies.map((enemy) => ({
    ...stats[enemy.unitId],
    slot: enemy.slot
  }));
}

@ccclass('BattleController')
export class BattleController extends Component {
  battleState = createInitialBattleState({ allies: [], enemies: [] });
  skillUsed = false;
  waveIndex = 0;
  currentStageId = appRouter.payload.stageId ?? 'stage-1';
  selectedSkillId = 'wolfBlessing';

  onLoad(): void {
    const save = getAppState().save;
    const selectedHeroId = save.selectedHeroId ?? 'asu';
    const heroIds = Array.from(new Set([selectedHeroId, ...save.unlockedHeroIds]));
    const allies = buildAllies(heroIds);
    const enemies = buildEnemies(this.currentStageId, this.waveIndex);
    const hero = loadHeroes().find((item) => item.id === selectedHeroId);

    this.selectedSkillId = hero?.skillId ?? 'wolfBlessing';
    this.battleState = createInitialBattleState({ allies, enemies });
  }

  getStoryText(): string {
    return getStageById(this.currentStageId)?.storyBefore ?? '';
  }

  getSkillLabel(): string {
    return heroSkillLabels[this.selectedSkillId] ?? '英雄技能';
  }

  getWaveLabel(): string {
    const stage = getStageById(this.currentStageId);
    const total = stage?.waves.length ?? 1;
    return `第 ${this.waveIndex + 1} / ${total} 波`;
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
        this.skillUsed = false;
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

    this.battleState = tickBattle(this.battleState, deltaTime * 1000);
  }

  useSkill(): void {
    if (this.skillUsed) return;
    this.battleState = applyHeroSkill(this.selectedSkillId, this.battleState);
    this.skillUsed = true;
  }
}
