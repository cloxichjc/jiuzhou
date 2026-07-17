import { describe, expect, it } from 'vitest';
import { createInitialBattleState, tickBattle } from '../../assets/scripts/battle/BattleReducer';
import type { BattleUnitInput } from '../../assets/scripts/battle/BattleTypes';
import { getEnemyById, getHeroById, loadStages } from '../../assets/scripts/data/loadConfig';

const heroSlots: Record<string, number> = { asu: 3, jiye: 1, yuran: 5 };

function alliesOf(heroIds: string[]): BattleUnitInput[] {
  return heroIds.map((id) => {
    const hero = getHeroById(id);
    if (!hero) throw new Error(`missing hero ${id}`);
    return { id: hero.id, hp: hero.hp, attack: hero.attack, attackIntervalMs: hero.attackIntervalMs, slot: heroSlots[id] };
  });
}

function enemiesOf(stageId: string, waveIndex: number): BattleUnitInput[] {
  const stage = loadStages().find((item) => item.id === stageId);
  const wave = stage?.waves[waveIndex];
  if (!wave) throw new Error(`missing wave ${stageId}#${waveIndex}`);
  return wave.enemies.map((enemy) => {
    const config = getEnemyById(enemy.unitId);
    if (!config) throw new Error(`missing enemy ${enemy.unitId}`);
    return { id: config.id, hp: config.hp, attack: config.attack, attackIntervalMs: config.attackIntervalMs, slot: enemy.slot };
  });
}

/** 以 100ms 步长模拟整场战斗（含波次推进），返回总耗时与最终阶段。 */
function simulateStage(stageId: string, heroIds: string[]): { durationMs: number; phase: string } {
  const stage = loadStages().find((item) => item.id === stageId);
  if (!stage) throw new Error(`missing stage ${stageId}`);

  let totalMs = 0;
  let allies = alliesOf(heroIds);

  for (let waveIndex = 0; waveIndex < stage.waves.length; waveIndex += 1) {
    let { state } = { state: createInitialBattleState({ allies, enemies: enemiesOf(stageId, waveIndex) }) };

    while (state.phase !== 'won' && state.phase !== 'lost') {
      const result = tickBattle(state, 100);
      state = result.state;
      totalMs += 100;
      if (totalMs > 120_000) throw new Error(`stage ${stageId} wave ${waveIndex} did not terminate`);
    }

    if (state.phase === 'lost') {
      return { durationMs: totalMs, phase: 'lost' };
    }

    allies = state.allies;
  }

  return { durationMs: totalMs, phase: 'won' };
}

describe('stage balance (数值调校锁)', () => {
  it('config files are valid', () => {
    const stages = loadStages();
    expect(stages).toHaveLength(5);
    for (const stage of stages) {
      expect(stage.waves.length).toBeGreaterThan(0);
    }
  });

  it.each([
    ['stage-1', ['asu']],
    ['stage-2', ['asu']],
    ['stage-3', ['asu', 'jiye']],
    ['stage-4', ['asu', 'jiye', 'yuran']],
    ['stage-5', ['asu', 'jiye', 'yuran']]
  ])('%s 默认阵容可通关，且时长在 4-90 秒之间（不会两秒结束也不会拖沓）', (stageId, heroIds) => {
    const { durationMs, phase } = simulateStage(stageId, heroIds);

    expect(phase).toBe('won');
    expect(durationMs).toBeGreaterThanOrEqual(4000);
    expect(durationMs).toBeLessThanOrEqual(90_000);
  });
});
