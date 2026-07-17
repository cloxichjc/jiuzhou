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
  if (unitId === 'jiye') {
    return '枪锋所指，虎牙所向，宁为玉碎。';
  }
  if (unitId === 'asu') {
    return '苍狼之裔，以祝祷护住同伴。';
  }
  if (unitId === 'xiyan') {
    return '不世名将，雷厉风行。';
  }
  return '羽族少女，风之所向，无拘无束。';
}
