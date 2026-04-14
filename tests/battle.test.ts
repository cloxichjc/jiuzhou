import { describe, expect, it } from 'vitest';
import { simulateBattle } from '../src/game/core/battle';
import {
  advanceAfterVictory,
  applyRewardChoice,
  assignBoardSlot,
  clearBoardSlot,
  getDeployedUnits,
  initialRunState,
} from '../src/game/core/run-state';

describe('simulateBattle', () => {
  it('lets a simple tribe squad defeat the first wave and keep survivors', () => {
    const expandedState = applyRewardChoice(initialRunState, {
      kind: 'economy',
      id: 'population-2',
      label: '扩充人口',
      description: '人口上限 +1，金币 +20。',
    });

    const deployedState = assignBoardSlot(
      assignBoardSlot(expandedState, expandedState.bench[0].instanceId, 0),
      expandedState.bench[1].instanceId,
      1
    );

    const result = simulateBattle({
      alliedUnits: getDeployedUnits(deployedState),
      enemyWaveId: 'wave-1',
      ownedTotemIds: ['war-drum'],
    });

    expect(result.outcome).toBe('victory');
    expect(result.remainingHealth).toBeGreaterThan(0);
    expect(result.damageLog.length).toBeGreaterThan(0);
    expect(result.events.length).toBeGreaterThanOrEqual(2);
    expect(result.events[0]?.timestampMs).toBeGreaterThan(0);
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
    expect(afterReward.boardSlots).toHaveLength(3);
  });

  it('assigns and clears board slots without mutating bench ownership', () => {
    const deployed = assignBoardSlot(initialRunState, initialRunState.bench[0].instanceId, 0);
    expect(getDeployedUnits(deployed)).toHaveLength(1);
    expect(deployed.usedPopulation).toBe(1);

    const cleared = clearBoardSlot(deployed, 0);
    expect(getDeployedUnits(cleared)).toHaveLength(0);
    expect(cleared.usedPopulation).toBe(0);
  });
});
