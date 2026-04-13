import { totems } from '../data/totems';
import { units } from '../data/units';
import type { BenchUnit, TotemDefinition, UnitDefinition } from '../types';

let benchCounter = 0;

export function createBenchUnit(unitId: string, star: 1 | 2 | 3 = 1): BenchUnit {
  benchCounter += 1;
  return {
    instanceId: `${unitId}-${benchCounter}`,
    unitId,
    star,
  };
}

export function getUnitDefinitionOrThrow(unitId: string): UnitDefinition {
  const unit = units.find((entry) => entry.id === unitId);
  if (!unit) {
    throw new Error(`Unknown unit: ${unitId}`);
  }
  return unit;
}

export function getTotemDefinitionOrThrow(totemId: string): TotemDefinition {
  const totem = totems.find((entry) => entry.id === totemId);
  if (!totem) {
    throw new Error(`Unknown totem: ${totemId}`);
  }
  return totem;
}

export function getStarMultiplier(star: BenchUnit['star']): number {
  if (star === 1) {
    return 1;
  }
  if (star === 2) {
    return 1.8;
  }
  return 2.7;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function computeUnitPower(unit: BenchUnit, ownedTotemIds: string[]): number {
  const definition = getUnitDefinitionOrThrow(unit.unitId);
  const starMultiplier = getStarMultiplier(unit.star);
  let attack = definition.attack * starMultiplier;
  let health = definition.health * starMultiplier;

  for (const totemId of ownedTotemIds) {
    const totem = getTotemDefinitionOrThrow(totemId);
    if (totem.stat === 'attack') {
      attack *= 1 + totem.modifier;
    }
    if (totem.stat === 'health') {
      health *= 1 + totem.modifier;
    }
    if (totem.stat === 'tempo' && (definition.role === 'frontline' || definition.role === 'skirmisher')) {
      attack *= 1 + totem.modifier;
    }
  }

  return attack + health / 8;
}
