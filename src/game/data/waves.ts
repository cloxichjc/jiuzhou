import type { WaveDefinition } from '../types';

export const waves: WaveDefinition[] = [
  {
    id: 'wave-1',
    title: '荒魂试探',
    powerScore: 24,
    enemies: [
      { id: 'wight-scout', name: '荒魂斥候', kind: 'melee', attack: 10, health: 56, speed: 42 },
    ],
  },
  {
    id: 'wave-2',
    title: '敌对斥候',
    powerScore: 38,
    enemies: [
      { id: 'raider', name: '敌对部族兵', kind: 'melee', attack: 13, health: 74, speed: 48 },
      { id: 'raider-archer', name: '荒地弓手', kind: 'projectile', attack: 12, health: 52, range: 170, attackIntervalMs: 1260, speed: 28 },
    ],
  },
  {
    id: 'wave-3',
    title: '河络残兵',
    powerScore: 54,
    enemies: [
      { id: 'heluo-guard', name: '河络残兵', kind: 'melee', attack: 15, health: 92, speed: 40 },
      { id: 'heluo-bolt', name: '弩台残械', kind: 'projectile', attack: 16, health: 48, range: 190, attackIntervalMs: 1320, speed: 24 },
    ],
  },
  {
    id: 'wave-4',
    title: '寒潮突袭',
    powerScore: 72,
    enemies: [
      { id: 'ice-wight', name: '寒魂', kind: 'spell', attack: 18, health: 88, range: 120, attackIntervalMs: 1380, speed: 34 },
      { id: 'ice-wight-2', name: '寒魂', kind: 'spell', attack: 18, health: 88, range: 120, attackIntervalMs: 1380, speed: 34 },
      { id: 'raider-chief', name: '部族勇士', kind: 'melee', attack: 20, health: 120, speed: 50 },
    ],
  },
  {
    id: 'wave-5',
    title: '北陆决斗',
    powerScore: 95,
    enemies: [
      { id: 'warlord', name: '北陆战首', kind: 'melee', attack: 26, health: 160, speed: 52, attackIntervalMs: 980 },
      { id: 'guard', name: '护卫', kind: 'melee', attack: 16, health: 94, speed: 42 },
      { id: 'guard-2', name: '护卫', kind: 'melee', attack: 16, health: 94, speed: 42 },
    ],
  },
];
