import { createRewardChoices } from '../core/rewards';
import { getTotemDefinitionOrThrow, getUnitDefinitionOrThrow } from '../core/helpers';
import type { RewardChoice } from '../types';

export interface RewardVisualChoice extends RewardChoice {
  artKey: string;
  chipText: string;
}

export interface RewardPanelModel {
  title: string;
  subtitle: string;
  choices: RewardVisualChoice[];
}

export function buildRewardPanelModel(input: {
  waveNumber: number;
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}): RewardPanelModel {
  return {
    title: '通关奖励',
    subtitle: `第 ${input.waveNumber} 波战斗结束，挑选下一层战团势能`,
    choices: createRewardChoices(input).map(toVisualChoice),
  };
}

function toVisualChoice(choice: RewardChoice): RewardVisualChoice {
  if (choice.kind === 'unit') {
    const unit = getUnitDefinitionOrThrow(choice.id);
    return {
      ...choice,
      artKey: `unit-${choice.id}`,
      chipText: unit.skillName,
    };
  }

  if (choice.kind === 'totem') {
    const totem = getTotemDefinitionOrThrow(choice.id);
    return {
      ...choice,
      artKey: `totem-${choice.id}`,
      chipText: totem.name,
    };
  }

  return {
    ...choice,
    artKey: 'button-lacquer',
    chipText: '军资',
  };
}
