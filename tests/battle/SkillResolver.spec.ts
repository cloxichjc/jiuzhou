import { describe, expect, it } from 'vitest';
import { applyHeroSkill } from '../../assets/scripts/battle/SkillResolver';

describe('SkillResolver', () => {
  it('applies 阿苏勒 skill as a team shield buff', () => {
    const state = applyHeroSkill('wolfBlessing', {
      phase: 'running',
      elapsedMs: 0,
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0, shield: 0 }],
      enemies: []
    });

    expect(state.allies[0].shield).toBe(20);
  });

  it('applies 姬野 skill as direct burst damage to the first enemy', () => {
    const state = applyHeroSkill('tigerCharge', {
      phase: 'running',
      elapsedMs: 0,
      allies: [],
      enemies: [{ id: 'enemy-1', hp: 40, attack: 5, slot: 0 }]
    });

    expect(state.enemies[0].hp).toBe(15);
  });
});
