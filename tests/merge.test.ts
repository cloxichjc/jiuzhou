import { describe, expect, it } from 'vitest';
import { createBenchUnit } from '../src/game/core/helpers';
import { mergeBenchUnits } from '../src/game/core/merge';
import { assignBoardSlot, autoMergeRunState } from '../src/game/core/run-state';

describe('mergeBenchUnits', () => {
  it('merges three matching unit ids into a higher-star result', () => {
    const result = mergeBenchUnits([
      createBenchUnit('jiye'),
      createBenchUnit('jiye'),
      createBenchUnit('jiye'),
    ]);

    expect(result.merged).toBe(true);
    expect(result.mergedUnit?.unitId).toBe('jiye');
    expect(result.mergedUnit?.star).toBe(2);
    expect(result.bench).toHaveLength(1);
    expect(result.consumedIds).toHaveLength(3);
  });

  it('keeps a merged unit assigned to the first consumed board slot', () => {
    const first = createBenchUnit('jiye');
    const second = createBenchUnit('jiye');
    const third = createBenchUnit('jiye');

    const deployedState = assignBoardSlot(
      {
        health: 100,
        gold: 50,
        population: 2,
        usedPopulation: 0,
        waveNumber: 1,
        bench: [first, second, third],
        boardSlots: [null, null, null],
        unlockedUnitIds: ['jiye'],
        ownedTotemIds: [],
      },
      first.instanceId,
      1
    );

    const mergedState = autoMergeRunState(deployedState);

    expect(mergedState.bench).toHaveLength(1);
    expect(mergedState.boardSlots[1]).toBe(mergedState.bench[0].instanceId);
  });
});
