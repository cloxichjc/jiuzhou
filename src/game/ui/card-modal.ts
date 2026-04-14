import { getUnitDefinitionOrThrow } from '../core/helpers';

export function buildUnitCardLines(unitId: string, star = 1): string[] {
  const unit = getUnitDefinitionOrThrow(unitId);
  return [
    `${unit.name} · ${star}星`,
    `攻击 ${Math.round(unit.attack * star)} / 生命 ${Math.round(unit.health * (1 + (star - 1) * 0.7))}`,
    `${unit.skillName}：${unit.skillText}`,
    flavorText(unitId),
    unit.role === 'frontline' ? '定位：顶住敌阵，承担正面接敌。'
      : unit.role === 'support' ? '定位：后排施术，削弱敌势。'
      : unit.role === 'ranged' ? '定位：保持距离，穿透压制。'
      : '定位：高速突入，优先抢节奏。',
  ];
}

function flavorText(unitId: string): string {
  if (unitId === 'axe-warrior') {
    return '北陆最先迎敌的一排战骨。';
  }
  if (unitId === 'frost-shaman') {
    return '以霜语祭骨，延缓敌势。';
  }
  if (unitId === 'wolf-rider') {
    return '以狼影撕开敌阵侧翼。';
  }
  return '熟悉殇州风雪与荒原追猎。';
}
