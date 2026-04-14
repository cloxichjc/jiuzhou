import { waves } from '../data/waves';
import { clamp, getStarMultiplier, getUnitDefinitionOrThrow } from './helpers';
import type {
  BattleActor,
  BattleRuntimeState,
  BattleSimulationInput,
  BattleSimulationResult,
  BattleStepResult,
  BenchUnit,
  WaveEnemy,
} from '../types';

const ALLY_START_POSITIONS = [
  { x: 118, y: 432 },
  { x: 196, y: 386 },
  { x: 274, y: 432 },
];

const ENEMY_START_POSITIONS = [
  { x: 96, y: 258 },
  { x: 192, y: 238 },
  { x: 288, y: 258 },
];

export function createBattleRuntime(input: BattleSimulationInput): BattleRuntimeState {
  const wave = waves.find((entry) => entry.id === input.enemyWaveId);
  if (!wave) {
    throw new Error(`Unknown wave: ${input.enemyWaveId}`);
  }

  const alliedActors = input.alliedUnits.map((unit, index) => createAllyActor(unit, input.ownedTotemIds, index));
  const enemyActors = wave.enemies.map((enemy, index) => createEnemyActor(enemy, index));

  return {
    waveId: wave.id,
    waveLabel: wave.title,
    elapsedMs: 0,
    status: alliedActors.length > 0 && enemyActors.length > 0 ? 'ongoing' : alliedActors.length > 0 ? 'victory' : 'defeat',
    actors: [...alliedActors, ...enemyActors],
  };
}

export function stepBattleRuntime(state: BattleRuntimeState, deltaMs: number): BattleStepResult {
  if (state.status !== 'ongoing') {
    return { state, events: [] };
  }

  const actors = state.actors.map((actor) => ({
    ...actor,
    cooldownRemainingMs: Math.max(0, actor.cooldownRemainingMs - deltaMs),
  }));
  const events = [];

  for (const actor of actors) {
    if (actor.currentHealth <= 0) {
      continue;
    }

    const target = findNearestTarget(actor, actors);
    if (!target) {
      continue;
    }

    const distance = PhaserLike.distance(actor.x, actor.y, target.x, target.y);

    if (distance > actor.range) {
      const moveDistance = Math.min((actor.speed * deltaMs) / 1000, distance - actor.range);
      const dx = ((target.x - actor.x) / distance) * moveDistance;
      const dy = ((target.y - actor.y) / distance) * moveDistance;
      actor.x += dx;
      actor.y += dy;
      continue;
    }

    if (actor.cooldownRemainingMs > 0) {
      continue;
    }

    const damage = Math.max(5, Math.round(actor.attack));
    target.currentHealth = Math.max(0, target.currentHealth - damage);
    actor.cooldownRemainingMs = actor.attackIntervalMs;
    events.push({
      actorId: actor.id,
      actorName: actor.name,
      targetId: target.id,
      targetName: target.name,
      amount: damage,
      kind: actor.kind,
      timestampMs: state.elapsedMs + deltaMs,
      fromX: actor.x,
      fromY: actor.y,
      toX: target.x,
      toY: target.y,
    });
  }

  const nextState: BattleRuntimeState = {
    ...state,
    elapsedMs: state.elapsedMs + deltaMs,
    actors,
    status: determineBattleStatus(actors),
  };

  return {
    state: nextState,
    events,
  };
}

export function summarizeBattleRuntime(state: BattleRuntimeState): BattleSimulationResult {
  const alliedActors = state.actors.filter((actor) => actor.team === 'ally');
  const enemyActors = state.actors.filter((actor) => actor.team === 'enemy');
  const alliedPower = alliedActors.reduce((sum, actor) => sum + actor.attack + actor.maxHealth / 8, 0);
  const enemyPower = enemyActors.reduce((sum, actor) => sum + actor.attack + actor.maxHealth / 8, 0);
  const alliedHealthRatio = alliedActors.length === 0
    ? 0
    : alliedActors.reduce((sum, actor) => sum + Math.max(0, actor.currentHealth), 0) /
      alliedActors.reduce((sum, actor) => sum + actor.maxHealth, 0);

  return {
    outcome: state.status === 'victory' ? 'victory' : 'defeat',
    remainingHealth: clamp(Math.round(alliedHealthRatio * 100), 0, 100),
    waveLabel: state.waveLabel,
    alliedPower,
    enemyPower,
    damageLog: [
      `ally:${alliedPower.toFixed(1)}`,
      `enemy:${enemyPower.toFixed(1)}`,
      `duration:${Math.round(state.elapsedMs)}ms`,
    ],
    events: [],
  };
}

export function simulateBattle(input: BattleSimulationInput): BattleSimulationResult {
  let runtime = createBattleRuntime(input);
  const allEvents = [];
  let safety = 0;

  while (runtime.status === 'ongoing' && safety < 240) {
    const step = stepBattleRuntime(runtime, 180);
    runtime = step.state;
    allEvents.push(...step.events);
    safety += 1;
  }

  const summary = summarizeBattleRuntime(runtime);
  return {
    ...summary,
    events: allEvents,
  };
}

function createAllyActor(unit: BenchUnit, ownedTotemIds: string[], index: number): BattleActor {
  const definition = getUnitDefinitionOrThrow(unit.unitId);
  const starMultiplier = getStarMultiplier(unit.star);
  const startingPoint = ALLY_START_POSITIONS[index % ALLY_START_POSITIONS.length];

  let attack = definition.attack * starMultiplier;
  let health = definition.health * starMultiplier;

  if (ownedTotemIds.includes('war-drum')) {
    attack *= 1.12;
  }
  if (ownedTotemIds.includes('frost-bone')) {
    health *= 1.16;
  }
  if (ownedTotemIds.includes('wolf-spirit') && (definition.role === 'frontline' || definition.role === 'skirmisher')) {
    attack *= 1.15;
  }

  return {
    id: unit.instanceId,
    name: definition.name,
    unitId: unit.unitId,
    team: 'ally',
    kind: definition.role === 'support' ? 'spell' : definition.role === 'ranged' ? 'projectile' : 'melee',
    x: startingPoint.x,
    y: startingPoint.y,
    currentHealth: Math.round(health),
    maxHealth: Math.round(health),
    attack: Math.round(attack),
    range: definition.range + (definition.role === 'ranged' ? 38 : 0),
    speed: definition.role === 'skirmisher' ? 60 : definition.role === 'support' ? 30 : 42,
    attackIntervalMs: definition.attackIntervalMs,
    cooldownRemainingMs: definition.attackIntervalMs * 0.35,
  };
}

function createEnemyActor(enemy: WaveEnemy, index: number): BattleActor {
  const startingPoint = ENEMY_START_POSITIONS[index % ENEMY_START_POSITIONS.length];
  return {
    id: enemy.id,
    name: enemy.name,
    team: 'enemy',
    kind: 'melee',
    x: startingPoint.x,
    y: startingPoint.y,
    currentHealth: enemy.health,
    maxHealth: enemy.health,
    attack: enemy.attack,
    range: 42,
    speed: 34,
    attackIntervalMs: 1180,
    cooldownRemainingMs: 280,
  };
}

function findNearestTarget(actor: BattleActor, actors: BattleActor[]): BattleActor | undefined {
  const candidates = actors.filter(
    (candidate) => candidate.team !== actor.team && candidate.currentHealth > 0
  );
  let nearest: BattleActor | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = PhaserLike.distance(actor.x, actor.y, candidate.x, candidate.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = candidate;
    }
  }

  return nearest;
}

function determineBattleStatus(actors: BattleActor[]): BattleRuntimeState['status'] {
  const hasAllies = actors.some((actor) => actor.team === 'ally' && actor.currentHealth > 0);
  const hasEnemies = actors.some((actor) => actor.team === 'enemy' && actor.currentHealth > 0);

  if (hasAllies && hasEnemies) {
    return 'ongoing';
  }
  if (hasAllies) {
    return 'victory';
  }
  return 'defeat';
}

const PhaserLike = {
  distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.hypot(bx - ax, by - ay);
  },
};
