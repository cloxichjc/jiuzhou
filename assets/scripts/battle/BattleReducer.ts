import type { BattleEvent, BattleSetup, BattleState, BattleStepResult, BattleUnit } from './BattleTypes';
import { pickTarget } from './Targeting';

const DEFAULT_ATTACK_INTERVAL_MS = 1200;
const MIN_DAMAGE = 1;

function normalizeUnit(input: BattleSetup['allies'][number]): BattleUnit {
  const attackIntervalMs = input.attackIntervalMs ?? DEFAULT_ATTACK_INTERVAL_MS;
  return {
    ...input,
    maxHp: input.maxHp ?? input.hp,
    attackIntervalMs,
    cooldownMs: input.cooldownMs ?? attackIntervalMs
  };
}

export function createInitialBattleState(setup: BattleSetup): BattleState {
  return {
    phase: 'ready',
    elapsedMs: 0,
    allies: setup.allies.map(normalizeUnit),
    enemies: setup.enemies.map(normalizeUnit)
  };
}

function isSlowed(unit: BattleUnit, elapsedMs: number): boolean {
  return (unit.slowedUntilMs ?? 0) > elapsedMs;
}

function effectiveInterval(unit: BattleUnit, elapsedMs: number): number {
  return isSlowed(unit, elapsedMs) ? unit.attackIntervalMs * (unit.slowFactor ?? 1.5) : unit.attackIntervalMs;
}

function computeDamage(attacker: BattleUnit, defender: BattleUnit, elapsedMs: number): number {
  const reduction = (defender.damageReductionUntilMs ?? 0) > elapsedMs ? (defender.damageReductionRatio ?? 0.2) : 0;
  return Math.max(MIN_DAMAGE, Math.round(attacker.attack * (1 - reduction)));
}

/** 一方所有存活单位推进冷却并出手，返回产生的事件（直接改写传入的 next state）。 */
function runSideAttacks(
  attackers: BattleUnit[],
  defenders: BattleUnit[],
  deltaMs: number,
  elapsedMs: number,
  events: BattleEvent[]
): void {
  for (const attacker of attackers) {
    if (attacker.hp <= 0) {
      continue;
    }

    attacker.cooldownMs -= deltaMs;
    if (attacker.cooldownMs > 0) {
      continue;
    }

    const target = pickTarget(attacker.slot, defenders);
    if (!target) {
      attacker.cooldownMs = 0;
      continue;
    }

    const damage = computeDamage(attacker, target, elapsedMs);
    target.hp -= damage;
    events.push({
      type: 'attack',
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      killed: target.hp <= 0
    });

    attacker.cooldownMs = effectiveInterval(attacker, elapsedMs);
  }
}

export function tickBattle(state: BattleState, deltaMs: number): BattleStepResult {
  const events: BattleEvent[] = [];
  const next: BattleState = {
    ...state,
    phase: state.phase === 'ready' ? 'running' : state.phase,
    elapsedMs: state.elapsedMs + deltaMs,
    allies: state.allies.map((unit) => ({ ...unit })),
    enemies: state.enemies.map((unit) => ({ ...unit }))
  };

  if (state.phase === 'ready') {
    events.push({ type: 'phaseChanged', phase: 'running' });
  }

  if (next.phase === 'won' || next.phase === 'lost') {
    return { state: next, events };
  }

  const anyAlly = next.allies.some((unit) => unit.hp > 0);
  const anyEnemy = next.enemies.some((unit) => unit.hp > 0);

  if (!anyAlly || !anyEnemy) {
    next.phase = anyAlly ? 'won' : 'lost';
    events.push({ type: 'phaseChanged', phase: next.phase });
    return { state: next, events };
  }

  runSideAttacks(next.allies, next.enemies, deltaMs, next.elapsedMs, events);
  runSideAttacks(next.enemies, next.allies, deltaMs, next.elapsedMs, events);

  const alliesAlive = next.allies.some((unit) => unit.hp > 0);
  const enemiesAlive = next.enemies.some((unit) => unit.hp > 0);

  if (!alliesAlive || !enemiesAlive) {
    next.phase = alliesAlive ? 'won' : 'lost';
    events.push({ type: 'phaseChanged', phase: next.phase });
  }

  return { state: next, events };
}
