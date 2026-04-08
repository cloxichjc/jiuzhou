import type { BattleState } from './BattleTypes';

export function applyHeroSkill(skillId: string, state: BattleState): BattleState {
  switch (skillId) {
    case 'wolfBlessing':
      return {
        ...state,
        allies: state.allies.map((ally) => ({
          ...ally,
          shield: (ally.shield ?? 0) + 20
        }))
      };
    case 'tigerCharge': {
      const enemies = state.enemies.map((enemy, index) =>
        index === 0 ? { ...enemy, hp: enemy.hp - 25 } : { ...enemy }
      );
      return {
        ...state,
        enemies
      };
    }
    case 'featherBounce': {
      let hits = 0;
      const enemies = state.enemies.map((enemy) => {
        if (enemy.hp <= 0 || hits >= 3) {
          return { ...enemy };
        }
        hits += 1;
        return { ...enemy, hp: enemy.hp - 12 };
      });
      return {
        ...state,
        enemies
      };
    }
    default:
      return state;
  }
}
