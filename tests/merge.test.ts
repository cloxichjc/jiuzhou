import { describe, expect, it } from 'vitest';
import { createBenchUnit } from '../src/game/core/helpers';
import { mergeBenchUnits } from '../src/game/core/merge';

describe('mergeBenchUnits', () => {
  it('merges three matching unit ids into a higher-star result', () => {
    const result = mergeBenchUnits([
      createBenchUnit('axe-warrior'),
      createBenchUnit('axe-warrior'),
      createBenchUnit('axe-warrior'),
    ]);

    expect(result.merged).toBe(true);
    expect(result.mergedUnit?.unitId).toBe('axe-warrior');
    expect(result.mergedUnit?.star).toBe(2);
    expect(result.bench).toHaveLength(1);
  });
});
