import type { UnitDefinition } from '../types';

/**
 * 可操作单位：缥缈录三主角 + 息衍。
 * 机制钩子与数值沿用北陆战团原表（换皮不改数值）：
 * jiye↔斧战（三击暴击）、asu↔霜巫（攻击减速）、xiyan↔狼骑（首击加成）、yuran↔猎手（远距加成）。
 */
export const units: UnitDefinition[] = [
  {
    id: 'jiye',
    name: '姬野',
    role: 'frontline',
    tribe: 'piaomiao-heroes',
    tier: 1,
    attack: 18,
    health: 120,
    attackIntervalMs: 1100,
    range: 42,
    skillName: '虎牙破阵',
    skillText: '每第三次攻击造成额外伤害。',
  },
  {
    id: 'asu',
    name: '阿苏勒',
    role: 'support',
    tribe: 'piaomiao-heroes',
    tier: 1,
    attack: 12,
    health: 88,
    attackIntervalMs: 1200,
    range: 180,
    skillName: '苍狼祝祷',
    skillText: '攻击会施加短暂减速。',
  },
  {
    id: 'xiyan',
    name: '息衍',
    role: 'skirmisher',
    tribe: 'piaomiao-heroes',
    tier: 1,
    attack: 15,
    health: 96,
    attackIntervalMs: 850,
    range: 54,
    skillName: '雷厉风行',
    skillText: '首次接敌时造成加成伤害。',
  },
  {
    id: 'yuran',
    name: '羽然',
    role: 'ranged',
    tribe: 'piaomiao-heroes',
    tier: 1,
    attack: 17,
    health: 82,
    attackIntervalMs: 1050,
    range: 210,
    skillName: '风羽回旋',
    skillText: '站位越靠后，攻击越高。',
  },
];
