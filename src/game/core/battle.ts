import { waves } from '../data/waves';
import { clamp, computeUnitPower } from './helpers';
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
  const finalScore = alliedPower - wave.powerScore;
  const remainingHealth = clamp(Math.round(70 + finalScore / 2.6), 0, 100);

  return {
    outcome: finalScore >= 0 ? 'victory' : 'defeat',
    remainingHealth,
    waveLabel: wave.title,
    damageLog: [
      `ally:${alliedPower.toFixed(1)}`,
      `enemy:${wave.powerScore.toFixed(1)}`,
      `delta:${finalScore.toFixed(1)}`,
    ],
  };
}
