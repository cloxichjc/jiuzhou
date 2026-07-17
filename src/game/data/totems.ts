import type { TotemDefinition } from '../types';

/** 九州名物（机制同原图腾，id 不变以保住存档/测试兼容）。 */
export const totems: TotemDefinition[] = [
  {
    id: 'war-drum',
    name: '青阳战旗',
    description: '全队攻击提升 12%。',
    stat: 'attack',
    modifier: 0.12,
  },
  {
    id: 'wolf-spirit',
    name: '苍狼血誓',
    description: '近战与突进单位攻击提升 15%。',
    stat: 'tempo',
    modifier: 0.15,
  },
  {
    id: 'frost-bone',
    name: '殇阳冰骨',
    description: '全队生命提升 16%。',
    stat: 'health',
    modifier: 0.16,
  },
];
