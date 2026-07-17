import { describe, expect, it } from 'vitest';
import { createInitialBattleState } from '../../assets/scripts/battle/BattleReducer';
import { applyHeroSkill } from '../../assets/scripts/battle/SkillResolver';

function battleWith(overrides: { allies?: object[]; enemies?: object[] }) {
  return createInitialBattleState({
    allies: (overrides.allies ?? []) as never[],
    enemies: (overrides.enemies ?? []) as never[]
  });
}

describe('SkillResolver', () => {
  it('苍狼祝祷：全队获得 8 秒 20% 减伤', () => {
    const state = battleWith({
      allies: [
        { id: 'asu', hp: 100, attack: 10, slot: 0 },
        { id: 'jiye', hp: 100, attack: 10, slot: 1 }
      ],
      enemies: [{ id: 'bandit', hp: 50, attack: 5, slot: 0 }]
    });

    const { state: next, events } = applyHeroSkill('wolfBlessing', state, 'asu');

    expect(next.allies[0].damageReductionUntilMs).toBe(8000);
    expect(next.allies[0].damageReductionRatio).toBe(0.2);
    expect(next.allies[1].damageReductionUntilMs).toBe(8000);
    expect(events[0]).toMatchObject({ type: 'skill', skillId: 'wolfBlessing', casterId: 'asu' });
    expect(events[0]).toMatchObject({ targetIds: ['asu', 'jiye'], hits: [] });
  });

  it('虎牙破阵：对全体敌人造成 25 点范围伤害并汇报击杀', () => {
    const state = battleWith({
      allies: [{ id: 'jiye', hp: 100, attack: 10, slot: 1 }],
      enemies: [
        { id: 'enemy-1', hp: 40, attack: 5, slot: 0 },
        { id: 'enemy-2', hp: 20, attack: 5, slot: 1 }
      ]
    });

    const { state: next, events } = applyHeroSkill('tigerCharge', state, 'jiye');

    expect(next.enemies[0].hp).toBe(15);
    expect(next.enemies[1].hp).toBe(-5);
    expect(events[0]).toMatchObject({
      type: 'skill',
      skillId: 'tigerCharge',
      hits: [
        { targetId: 'enemy-1', damage: 25, killed: false },
        { targetId: 'enemy-2', damage: 25, killed: true }
      ]
    });
  });

  it('风羽回旋：弹射最近的至多 3 名敌人并减速 2 秒', () => {
    const state = battleWith({
      allies: [{ id: 'yuran', hp: 80, attack: 10, slot: 5 }],
      enemies: [
        { id: 'near', hp: 30, attack: 5, slot: 5 },
        { id: 'mid', hp: 30, attack: 5, slot: 4 },
        { id: 'far', hp: 30, attack: 5, slot: 0 },
        { id: 'farthest', hp: 30, attack: 5, slot: 3 }
      ]
    });

    const { state: next, events } = applyHeroSkill('featherBounce', state, 'yuran');
    const byId = Object.fromEntries(next.enemies.map((enemy) => [enemy.id, enemy]));

    expect(byId.near.hp).toBe(18);
    expect(byId.mid.hp).toBe(18);
    expect(byId.farthest.hp).toBe(18);
    expect(byId.far.hp).toBe(30);
    expect(byId.near.slowedUntilMs).toBe(2000);
    expect(byId.near.slowFactor).toBe(1.5);
    expect(events[0]).toMatchObject({ type: 'skill', skillId: 'featherBounce' });
    expect(events[0].type === 'skill' && events[0].targetIds).toHaveLength(3);
  });

  it('unknown skill is a no-op', () => {
    const state = battleWith({ allies: [], enemies: [] });
    const { state: next, events } = applyHeroSkill('nope', state);

    expect(next).toBe(state);
    expect(events).toEqual([]);
  });
});
