import { describe, expect, it } from 'vitest';
import { createInitialBattleState, tickBattle } from '../../assets/scripts/battle/BattleReducer';

describe('BattleReducer', () => {
  it('moves the battle from ready to running on first tick and emits a phase event', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0 }],
      enemies: [{ id: 'bandit', hp: 40, attack: 5, slot: 0 }]
    });

    const { state: next, events } = tickBattle(state, 1000);
    expect(next.phase).toBe('running');
    expect(events).toContainEqual({ type: 'phaseChanged', phase: 'running' });
  });

  it('does not attack before the cooldown elapses', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0, attackIntervalMs: 1500 }],
      enemies: [{ id: 'bandit', hp: 40, attack: 5, slot: 0, attackIntervalMs: 1500 }]
    });

    const { state: next, events } = tickBattle(state, 1000);
    expect(next.enemies[0].hp).toBe(40);
    expect(events.filter((event) => event.type === 'attack')).toHaveLength(0);

    const after = tickBattle(next, 600);
    expect(after.state.enemies[0].hp).toBe(30);
    expect(after.events).toContainEqual({
      type: 'attack',
      attackerId: 'asu',
      targetId: 'bandit',
      damage: 10,
      killed: false
    });
  });

  it('marks the battle won when all enemies are defeated', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'jiye', hp: 100, attack: 50, slot: 0 }],
      enemies: [{ id: 'bandit', hp: 10, attack: 0, slot: 0 }]
    });

    const first = tickBattle(state, 1000);
    const second = tickBattle(first.state, 1000);

    expect(second.state.phase).toBe('won');
    expect(second.events).toContainEqual({ type: 'phaseChanged', phase: 'won' });
    expect(second.events).toContainEqual({
      type: 'attack',
      attackerId: 'jiye',
      targetId: 'bandit',
      damage: 50,
      killed: true
    });
  });

  it('prefers the same-column target over a farther one', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 1 }],
      enemies: [
        { id: 'far-same-col', hp: 100, attack: 0, slot: 4 },
        { id: 'near-other-col', hp: 100, attack: 0, slot: 0 }
      ]
    });

    const { events } = tickBattle(state, 2000);
    const attack = events.find((event) => event.type === 'attack' && event.attackerId === 'asu');

    expect(attack).toMatchObject({ targetId: 'far-same-col' });
  });

  it('applies damage reduction while the ward is active', () => {
    const state = createInitialBattleState({
      allies: [
        {
          id: 'asu',
          hp: 100,
          attack: 10,
          slot: 0,
          damageReductionUntilMs: 5000,
          damageReductionRatio: 0.2
        }
      ],
      enemies: [{ id: 'bandit', hp: 100, attack: 10, slot: 0, attackIntervalMs: 1000 }]
    });

    const { state: next } = tickBattle(state, 1200);
    expect(next.allies[0].hp).toBe(92);

    const later = tickBattle(next, 4000);
    const hit = later.events.find((event) => event.type === 'attack' && event.targetId === 'asu');
    expect(hit).toMatchObject({ damage: 10 });
  });

  it('lengthens the attack interval while the attacker is slowed', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0 }],
      enemies: [
        {
          id: 'bandit',
          hp: 200,
          attack: 5,
          slot: 0,
          attackIntervalMs: 1000,
          cooldownMs: 100,
          slowedUntilMs: 3000,
          slowFactor: 2
        }
      ]
    });

    const first = tickBattle(state, 500);
    expect(first.state.allies[0].hp).toBe(95);

    const second = tickBattle(first.state, 1500);
    expect(second.state.allies[0].hp).toBe(95);
  });
});
