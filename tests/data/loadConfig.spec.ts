import { describe, expect, it } from 'vitest';
import { validateEnemies, validateHeroes, validateStages } from '../../assets/scripts/data/loadConfig';

const heroFixture = {
  role: 'support' as const,
  faction: 'north' as const,
  skillName: '苍狼祝祷',
  summary: '',
  skillSummary: '',
  hp: 100,
  attack: 10,
  attackIntervalMs: 1200
};

describe('loadConfig validation', () => {
  it('accepts the MVP hero roster', () => {
    const result = validateHeroes([
      { ...heroFixture, id: 'asu', name: '阿苏勒', skillId: 'wolfBlessing' },
      { ...heroFixture, id: 'jiye', name: '姬野', skillId: 'tigerCharge' },
      { ...heroFixture, id: 'yuran', name: '羽然', skillId: 'featherBounce' }
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects heroes with invalid combat stats', () => {
    const result = validateHeroes([
      { ...heroFixture, id: 'asu', name: '阿苏勒', skillId: 'wolfBlessing', hp: 0 },
      { ...heroFixture, id: 'jiye', name: '姬野', skillId: 'tigerCharge' },
      { ...heroFixture, id: 'yuran', name: '羽然', skillId: 'featherBounce' }
    ]);

    expect(result.valid).toBe(false);
  });

  it('accepts the MVP enemy roster', () => {
    const result = validateEnemies([
      { id: 'bandit-melee', name: '山贼刀手', hp: 55, attack: 6, attackIntervalMs: 1400 }
    ]);

    expect(result.valid).toBe(true);
  });

  it('rejects a stage without enemy waves', () => {
    const result = validateStages([
      { id: 'stage-1', title: '乱世来客', storyBefore: '', storyAfter: '', waves: [] }
    ]);

    expect(result.valid).toBe(false);
  });
});
