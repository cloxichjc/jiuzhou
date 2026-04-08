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
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a stage without enemy waves', () => {
    const result = validateStages([
      { id: 'stage-1', title: '乱世来客', storyBefore: '', storyAfter: '', waves: [] }
    ]);

    expect(result.valid).toBe(false);
  });
});
