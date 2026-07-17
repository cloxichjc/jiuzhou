import type { BattleUnit } from './BattleTypes';

export const GRID_COLS = 3;

export function slotColumn(slot: number): number {
  return slot % GRID_COLS;
}

export function slotRow(slot: number): number {
  return Math.floor(slot / GRID_COLS);
}

/** 格子间曼哈顿距离（列差 + 行差）。 */
export function slotDistance(a: number, b: number): number {
  return Math.abs(slotColumn(a) - slotColumn(b)) + Math.abs(slotRow(a) - slotRow(b));
}

/**
 * 选择攻击目标：优先对位同列的存活敌人，否则取格子距离最近者；
 * 并列时取数组中靠前的一个（确定性，方便测试与回放）。
 */
export function pickTarget(attackerSlot: number, candidates: BattleUnit[]): BattleUnit | null {
  const living = candidates.filter((unit) => unit.hp > 0);
  if (living.length === 0) {
    return null;
  }

  const sameColumn = living.filter((unit) => slotColumn(unit.slot) === slotColumn(attackerSlot));
  const pool = sameColumn.length > 0 ? sameColumn : living;

  return pool.reduce((best, unit) =>
    slotDistance(attackerSlot, unit.slot) < slotDistance(attackerSlot, best.slot) ? unit : best
  );
}

/** 按与 referenceSlot 的距离升序返回存活单位（风羽回旋弹射用）。 */
export function nearestLivingUnits(referenceSlot: number, candidates: BattleUnit[], limit: number): BattleUnit[] {
  return candidates
    .filter((unit) => unit.hp > 0)
    .sort((a, b) => slotDistance(referenceSlot, a.slot) - slotDistance(referenceSlot, b.slot))
    .slice(0, limit);
}
