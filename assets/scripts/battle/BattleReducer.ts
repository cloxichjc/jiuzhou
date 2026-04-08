import type { BattleSetup, BattleState } from './BattleTypes';
import { firstLivingUnit } from './Targeting';

export function createInitialBattleState(setup: BattleSetup): BattleState {
  return {
    phase: 'ready',
    elapsedMs: 0,
    allies: setup.allies.map((unit) => ({ ...unit })),
    enemies: setup.enemies.map((unit) => ({ ...unit }))
  };
}

export function tickBattle(state: BattleState, deltaMs: number): BattleState {
  const next: BattleState = {
    ...state,
    phase: state.phase === 'ready' ? 'running' : state.phase,
    elapsedMs: state.elapsedMs + deltaMs,
    allies: state.allies.map((unit) => ({ ...unit })),
    enemies: state.enemies.map((unit) => ({ ...unit }))
  };

  const ally = firstLivingUnit(next.allies);
  const enemy = firstLivingUnit(next.enemies);

  if (!ally) {
    next.phase = 'lost';
    return next;
  }

  if (!enemy) {
    next.phase = 'won';
    return next;
  }

  enemy.hp -= ally.attack;
  if (enemy.hp <= 0) {
    next.phase = 'won';
    return next;
  }

  const incomingDamage = Math.max(enemy.attack - (ally.shield ?? 0), 0);
  ally.hp -= incomingDamage;
  ally.shield = 0;

  if (ally.hp <= 0) {
    next.phase = 'lost';
  }

  return next;
}
