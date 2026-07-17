import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../assets/scripts/battle/BattleTypes';
import {
  ALLY_BOARD,
  ENEMY_BOARD,
  buildUnitModels,
  enemyArtPath,
  frameArtPath,
  heroArtPath,
  mapEventsToEffects,
  slotRect,
  unitArtPath
} from '../../assets/scripts/ui/BattleViewModel';
import type { BattleUnitView } from '../../assets/scripts/ui/BattleController';

function view(partial: Partial<BattleUnitView> & { id: string; slot: number }): BattleUnitView {
  return {
    name: partial.id,
    hp: 100,
    maxHp: 100,
    alive: true,
    warded: false,
    slowed: false,
    ...partial
  };
}

describe('BattleViewModel art paths', () => {
  it('maps heroes and enemies to generated art', () => {
    expect(heroArtPath('asu')).toBe('art/portrait_asu');
    expect(unitArtPath('ally', 'jiye')).toBe('art/portrait_jiye');
    expect(enemyArtPath('bandit-shield')).toBe('art/enemy_shield');
    expect(enemyArtPath('captain')).toBe('art/enemy_captain');
    expect(unitArtPath('enemy', 'elite-guard')).toBe('art/enemy_elite');
    expect(frameArtPath('ally')).toBe('art/frame_ally');
    expect(frameArtPath('enemy')).toBe('art/frame_enemy');
  });

  it('falls back to the melee icon for unknown enemies', () => {
    expect(enemyArtPath('mystery')).toBe('art/enemy_melee');
  });
});

describe('BattleViewModel board geometry', () => {
  it('places slots in row-major order on a 3x2 grid', () => {
    const first = slotRect(ENEMY_BOARD, 0);
    const second = slotRect(ENEMY_BOARD, 1);
    const fourth = slotRect(ENEMY_BOARD, 3);

    expect(first).toEqual({ x: -208, y: 317, width: 180, height: 170 });
    expect(second.x).toBe(-208 + 180 + 28);
    expect(second.y).toBe(317);
    expect(fourth.x).toBe(-208);
    expect(fourth.y).toBe(317 - 170 - 24);
  });

  it('keeps the enemy board above the ally board', () => {
    expect(slotRect(ENEMY_BOARD, 5).y).toBeGreaterThan(slotRect(ALLY_BOARD, 0).y);
  });

  it('builds unit models with rect and art info', () => {
    const models = buildUnitModels('ally', [view({ id: 'asu', slot: 3 })], ALLY_BOARD);

    expect(models[0].rect).toEqual(slotRect(ALLY_BOARD, 3));
    expect(models[0].artPath).toBe('art/portrait_asu');
    expect(models[0].framePath).toBe('art/frame_ally');
  });
});

describe('BattleViewModel event mapping', () => {
  it('maps attack events with attacker side resolved', () => {
    const events: BattleEvent[] = [
      { type: 'attack', attackerId: 'asu', targetId: 'bandit-melee', damage: 9, killed: false },
      { type: 'attack', attackerId: 'bandit-melee', targetId: 'asu', damage: 6, killed: false }
    ];

    const effects = mapEventsToEffects(events, ['asu']);

    expect(effects).toEqual([
      { kind: 'attack', attackerId: 'asu', attackerSide: 'ally', targetId: 'bandit-melee', damage: 9, killed: false },
      { kind: 'attack', attackerId: 'bandit-melee', attackerSide: 'enemy', targetId: 'asu', damage: 6, killed: false }
    ]);
  });

  it('maps skill events and drops phase changes', () => {
    const events: BattleEvent[] = [
      { type: 'phaseChanged', phase: 'running' },
      {
        type: 'skill',
        skillId: 'tigerCharge',
        casterId: 'jiye',
        targetIds: ['bandit-melee'],
        hits: [{ targetId: 'bandit-melee', damage: 25, killed: true }]
      },
      { type: 'phaseChanged', phase: 'won' }
    ];

    const effects = mapEventsToEffects(events, ['jiye']);

    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ kind: 'skill', skillId: 'tigerCharge', hits: [{ targetId: 'bandit-melee', damage: 25, killed: true }] });
  });
});
