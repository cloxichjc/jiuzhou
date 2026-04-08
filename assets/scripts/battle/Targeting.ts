import type { BattleUnit } from './BattleTypes';

export function firstLivingUnit(units: BattleUnit[]): BattleUnit | null {
  return units.find((unit) => unit.hp > 0) ?? null;
}
