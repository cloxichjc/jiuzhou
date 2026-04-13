import { createBenchUnit } from './helpers';
import type { BenchUnit } from '../types';

export interface MergeResult {
  merged: boolean;
  mergedUnit?: BenchUnit;
  consumedIds?: string[];
  bench: BenchUnit[];
}

export function mergeBenchUnits(bench: BenchUnit[]): MergeResult {
  const groups = new Map<string, BenchUnit[]>();

  for (const unit of bench) {
    const key = `${unit.unitId}:${unit.star}`;
    const group = groups.get(key) ?? [];
    group.push(unit);
    groups.set(key, group);
  }

  for (const [key, group] of groups) {
    if (group.length < 3) {
      continue;
    }

    const [unitId, starText] = key.split(':');
    const star = Number(starText) as BenchUnit['star'];
    if (star >= 3) {
      continue;
    }

    const removableIds = new Set(group.slice(0, 3).map((unit) => unit.instanceId));
    const nextBench = bench.filter((unit) => !removableIds.has(unit.instanceId));
    const mergedUnit = createBenchUnit(unitId, (star + 1) as BenchUnit['star']);
    nextBench.push(mergedUnit);
    return {
      merged: true,
      mergedUnit,
      consumedIds: Array.from(removableIds),
      bench: nextBench,
    };
  }

  return {
    merged: false,
    bench,
  };
}
