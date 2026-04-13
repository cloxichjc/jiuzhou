import { getUnitDefinitionOrThrow } from '../core/helpers';

export function buildUnitCardLines(unitId: string, star = 1): string[] {
  const unit = getUnitDefinitionOrThrow(unitId);
  return [
    `${unit.name} · ${star}星`,
    `攻击 ${unit.attack} / 生命 ${unit.health}`,
    `${unit.skillName}：${unit.skillText}`,
  ];
}
