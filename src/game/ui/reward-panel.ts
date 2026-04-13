import { createRewardChoices } from '../core/rewards';
import type { RewardChoice } from '../types';

export interface RewardPanelModel {
  title: string;
  subtitle: string;
  choices: RewardChoice[];
}

export function buildRewardPanelModel(input: {
  waveNumber: number;
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}): RewardPanelModel {
  return {
    title: '通关奖励',
    subtitle: `第 ${input.waveNumber} 波战斗结束`,
    choices: createRewardChoices(input),
  };
}
