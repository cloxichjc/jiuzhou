import type { WaveDefinition } from '../types';

/** 南淮旧事五波：山贼 → 流寇 → 赤牙死士 → 赤牙百夫长。数值沿用原表。 */
export const waves: WaveDefinition[] = [
  {
    id: 'wave-1',
    title: '山贼试探',
    powerScore: 24,
    enemies: [
      { id: 'bandit-scout', name: '山贼斥候', kind: 'melee', attack: 10, health: 56, speed: 42, artKey: 'enemy-melee' },
    ],
  },
  {
    id: 'wave-2',
    title: '山贼来袭',
    powerScore: 38,
    enemies: [
      { id: 'bandit-melee', name: '山贼刀手', kind: 'melee', attack: 13, health: 74, speed: 48, artKey: 'enemy-melee' },
      { id: 'bandit-archer', name: '山贼弓手', kind: 'projectile', attack: 12, health: 52, range: 170, attackIntervalMs: 1260, speed: 28, artKey: 'enemy-ranged' },
    ],
  },
  {
    id: 'wave-3',
    title: '流寇残部',
    powerScore: 54,
    enemies: [
      { id: 'rogue-shield', name: '流寇盾卫', kind: 'melee', attack: 15, health: 92, speed: 40, artKey: 'enemy-shield' },
      { id: 'rogue-bolt', name: '流寇弩手', kind: 'projectile', attack: 16, health: 48, range: 190, attackIntervalMs: 1320, speed: 24, artKey: 'enemy-ranged' },
    ],
  },
  {
    id: 'wave-4',
    title: '赤牙死士',
    powerScore: 72,
    enemies: [
      { id: 'chiya-1', name: '赤牙死士', kind: 'spell', attack: 18, health: 88, range: 120, attackIntervalMs: 1380, speed: 34, artKey: 'enemy-elite' },
      { id: 'chiya-2', name: '赤牙死士', kind: 'spell', attack: 18, health: 88, range: 120, attackIntervalMs: 1380, speed: 34, artKey: 'enemy-elite' },
      { id: 'chiya-lead', name: '赤牙头目', kind: 'melee', attack: 20, health: 120, speed: 50, artKey: 'enemy-elite' },
    ],
  },
  {
    id: 'wave-5',
    title: '赤牙百夫长',
    powerScore: 95,
    enemies: [
      { id: 'centurion', name: '赤牙百夫长', kind: 'melee', attack: 26, health: 160, speed: 52, attackIntervalMs: 980, artKey: 'enemy-captain' },
      { id: 'guard-1', name: '赤牙护卫', kind: 'melee', attack: 16, health: 94, speed: 42, artKey: 'enemy-melee' },
      { id: 'guard-2', name: '赤牙护卫', kind: 'melee', attack: 16, health: 94, speed: 42, artKey: 'enemy-melee' },
    ],
  },
];
