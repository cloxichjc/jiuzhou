import type { TotemDefinition } from '../types';

export const totems: TotemDefinition[] = [
  {
    id: 'war-drum',
    name: '战鼓图腾',
    description: '全队攻击提升 12%。',
    stat: 'attack',
    modifier: 0.12,
  },
  {
    id: 'wolf-spirit',
    name: '狼灵图腾',
    description: '近战与突进单位攻击提升 15%。',
    stat: 'tempo',
    modifier: 0.15,
  },
  {
    id: 'frost-bone',
    name: '霜骨图腾',
    description: '全队生命提升 16%。',
    stat: 'health',
    modifier: 0.16,
  },
];
