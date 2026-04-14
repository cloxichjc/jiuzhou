import { waves } from '../data/waves';
import { clamp, computeUnitPower, getUnitDefinitionOrThrow } from './helpers';
import type { BattleSimulationInput, BattleSimulationResult } from '../types';

export function simulateBattle(input: BattleSimulationInput): BattleSimulationResult {
  const wave = waves.find((entry) => entry.id === input.enemyWaveId);
  if (!wave) {
    throw new Error(`Unknown wave: ${input.enemyWaveId}`);
  }

  const alliedPower = input.alliedUnits.reduce(
    (total, unit) => total + computeUnitPower(unit, input.ownedTotemIds),
    0
  );
  const enemyPower = wave.powerScore;
  const finalScore = alliedPower - enemyPower;
  const remainingHealth = clamp(Math.round(70 + finalScore / 2.6), 0, 100);
  const events = input.alliedUnits.map((unit, index) => {
    const unitDef = getUnitDefinitionOrThrow(unit.unitId);
    const target = wave.enemies[index % wave.enemies.length];
    return {
      actorId: unit.instanceId,
      actorName: unitDef.name,
      targetName: target.name,
      amount: Math.max(8, Math.round(computeUnitPower(unit, input.ownedTotemIds) / 5.2)),
      kind: unitDef.role === 'support' ? ('spell' as const) : unitDef.role === 'ranged' ? ('projectile' as const) : ('melee' as const),
      timestampMs: index * 220,
    };
  });

  return {
    outcome: finalScore >= 0 ? 'victory' : 'defeat',
    remainingHealth,
    waveLabel: wave.title,
    alliedPower,
    enemyPower,
    events,
    damageLog: [
      `ally:${alliedPower.toFixed(1)}`,
      `enemy:${enemyPower.toFixed(1)}`,
      `delta:${finalScore.toFixed(1)}`,
    ],
  };
}
