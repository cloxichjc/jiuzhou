import { totems } from '../data/totems';
import { units } from '../data/units';
import type { RewardChoice } from '../types';

export function createRewardChoices(input: {
  waveNumber: number;
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}): RewardChoice[] {
  const unitReward = units.find((unit) => !input.unlockedUnitIds.includes(unit.id)) ?? units[input.waveNumber % units.length];
  const totemReward = totems.find((totem) => !input.ownedTotemIds.includes(totem.id)) ?? totems[input.waveNumber % totems.length];

  return [
    {
      kind: 'unit',
      id: unitReward.id,
      label: unitReward.name,
      description: `招募 ${unitReward.skillName} 单位`,
    },
    {
      kind: 'totem',
      id: totemReward.id,
      label: totemReward.name,
      description: totemReward.description,
    },
    {
      kind: 'economy',
      id: `population-${input.waveNumber}`,
      label: '扩充人口',
      description: '人口上限 +1，金币 +20。',
    },
  ];
}
