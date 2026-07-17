import { describe, expect, it } from 'vitest';
import { nearestLivingUnits, pickTarget, slotDistance } from '../../assets/scripts/battle/Targeting';

describe('Targeting', () => {
  it('computes manhattan distance on the 3x2 grid', () => {
    expect(slotDistance(0, 0)).toBe(0);
    expect(slotDistance(0, 2)).toBe(2);
    expect(slotDistance(0, 5)).toBe(3);
    expect(slotDistance(1, 4)).toBe(1);
  });

  it('prefers a living same-column target', () => {
    const target = pickTarget(1, [
      { id: 'other-col', hp: 100, attack: 0, slot: 0, maxHp: 100, attackIntervalMs: 1000, cooldownMs: 0 },
      { id: 'same-col', hp: 100, attack: 0, slot: 4, maxHp: 100, attackIntervalMs: 1000, cooldownMs: 0 }
    ]);

    expect(target?.id).toBe('same-col');
  });

  it('skips dead units and falls back to the nearest living one', () => {
    const target = pickTarget(1, [
      { id: 'dead-same-col', hp: 0, attack: 0, slot: 1, maxHp: 100, attackIntervalMs: 1000, cooldownMs: 0 },
      { id: 'near', hp: 50, attack: 0, slot: 0, maxHp: 100, attackIntervalMs: 1000, cooldownMs: 0 },
      { id: 'far', hp: 50, attack: 0, slot: 5, maxHp: 100, attackIntervalMs: 1000, cooldownMs: 0 }
    ]);

    expect(target?.id).toBe('near');
  });

  it('returns null when every candidate is dead', () => {
    expect(pickTarget(0, [{ id: 'x', hp: 0, attack: 0, slot: 0, maxHp: 1, attackIntervalMs: 1, cooldownMs: 0 }])).toBeNull();
  });

  it('lists nearest living units for bounce skills', () => {
    const units = [
      { id: 'far', hp: 10, attack: 0, slot: 0, maxHp: 10, attackIntervalMs: 1000, cooldownMs: 0 },
      { id: 'near', hp: 10, attack: 0, slot: 5, maxHp: 10, attackIntervalMs: 1000, cooldownMs: 0 },
      { id: 'mid', hp: 10, attack: 0, slot: 4, maxHp: 10, attackIntervalMs: 1000, cooldownMs: 0 }
    ];

    expect(nearestLivingUnits(5, units, 2).map((unit) => unit.id)).toEqual(['near', 'mid']);
  });
});
