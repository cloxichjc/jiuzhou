import type { WaveDefinition } from '../types';

export const waves: WaveDefinition[] = [
  {
    id: 'wave-1',
    title: '荒魂试探',
    powerScore: 24,
    enemies: [
      { id: 'wight-scout', name: '荒魂斥候', attack: 10, health: 56 },
    ],
  },
  {
    id: 'wave-2',
    title: '敌对斥候',
    powerScore: 38,
    enemies: [
      { id: 'raider', name: '敌对部族兵', attack: 13, health: 74 },
      { id: 'raider-archer', name: '荒地弓手', attack: 12, health: 52 },
    ],
  },
  {
    id: 'wave-3',
    title: '河络残兵',
    powerScore: 54,
    enemies: [
      { id: 'heluo-guard', name: '河络残兵', attack: 15, health: 92 },
      { id: 'heluo-bolt', name: '弩台残械', attack: 16, health: 48 },
    ],
  },
  {
    id: 'wave-4',
    title: '寒潮突袭',
    powerScore: 72,
    enemies: [
      { id: 'ice-wight', name: '寒魂', attack: 18, health: 88 },
      { id: 'ice-wight-2', name: '寒魂', attack: 18, health: 88 },
      { id: 'raider-chief', name: '部族勇士', attack: 20, health: 120 },
    ],
  },
  {
    id: 'wave-5',
    title: '北陆决斗',
    powerScore: 95,
    enemies: [
      { id: 'warlord', name: '北陆战首', attack: 26, health: 160 },
      { id: 'guard', name: '护卫', attack: 16, health: 94 },
      { id: 'guard-2', name: '护卫', attack: 16, health: 94 },
    ],
  },
];
