import { describe, expect, it } from 'vitest';
import { simulateBattle } from '../src/game/core/battle';
import { advanceAfterVictory, applyRewardChoice, initialRunState } from '../src/game/core/run-state';

describe('simulateBattle', () => {
  it('lets a simple tribe squad defeat the first wave and keep survivors', () => {
    const result = simulateBattle({
      alliedUnits: initialRunState.bench.slice(0, 2),
      enemyWaveId: 'wave-1',
      ownedTotemIds: ['war-drum'],
    });

    expect(result.outcome).toBe('victory');
    expect(result.remainingHealth).toBeGreaterThan(0);
    expect(result.damageLog.length).toBeGreaterThan(0);
  });
});

describe('run-state loop', () => {
  it('advances the wave and increases population after an economy reward', () => {
    const afterWave = advanceAfterVictory(initialRunState);
    const afterReward = applyRewardChoice(afterWave, {
      kind: 'economy',
      id: 'population-2',
      label: '扩充人口',
      description: '人口上限 +1，金币 +20。',
    });

    expect(afterReward.waveNumber).toBe(2);
    expect(afterReward.population).toBe(2);
    expect(afterReward.gold).toBeGreaterThan(initialRunState.gold);
  });
});
