import { describe, expect, it } from 'vitest';
import { createInitialBattleState, tickBattle } from '../../assets/scripts/battle/BattleReducer';

describe('BattleReducer', () => {
  it('moves the battle from ready to running on first tick', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0 }],
      enemies: [{ id: 'bandit', hp: 40, attack: 5, slot: 0 }]
    });

    const next = tickBattle(state, 1000);
    expect(next.phase).toBe('running');
  });

  it('marks the battle won when all enemies are defeated', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'jiye', hp: 100, attack: 50, slot: 0 }],
      enemies: [{ id: 'bandit', hp: 10, attack: 0, slot: 0 }]
    });

    const next = tickBattle(tickBattle(state, 1000), 1000);
    expect(next.phase).toBe('won');
  });

  it('consumes shield before hp when the defender is buffed', () => {
    const state = createInitialBattleState({
      allies: [{ id: 'asu', hp: 100, attack: 10, slot: 0, shield: 20 }],
      enemies: [{ id: 'bandit', hp: 100, attack: 5, slot: 0 }]
    });

    const next = tickBattle(state, 1000);
    expect(next.allies[0].hp).toBe(100);
    expect(next.allies[0].shield).toBe(0);
  });
});
