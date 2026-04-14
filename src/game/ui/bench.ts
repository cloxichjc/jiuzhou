import { getUnitDefinitionOrThrow } from '../core/helpers';
import type { BenchUnit } from '../types';

export interface BenchCardModel {
  instanceId: string;
  unitId: string;
  star: BenchUnit['star'];
  title: string;
  subtitle: string;
  skillName: string;
  artKey: string;
  roleText: string;
  tagText: string;
}

export function buildBenchCardModel(benchUnit: BenchUnit): BenchCardModel {
  const unit = getUnitDefinitionOrThrow(benchUnit.unitId);
  return {
    instanceId: benchUnit.instanceId,
    unitId: benchUnit.unitId,
    star: benchUnit.star,
    title: unit.name,
    subtitle: `${roleLabel(unit.role)} · ${benchUnit.star}星`,
    skillName: unit.skillName,
    artKey: `unit-${benchUnit.unitId}`,
    roleText: roleLabel(unit.role),
    tagText: unit.skillName,
  };
}

function roleLabel(role: string): string {
  if (role === 'frontline') {
    return '前锋';
  }
  if (role === 'ranged') {
    return '远击';
  }
  if (role === 'support') {
    return '巫祝';
  }
  return '突袭';
}
