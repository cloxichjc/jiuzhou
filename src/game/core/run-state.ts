import { createBenchUnit } from './helpers';
import { mergeBenchUnits } from './merge';
import type { RewardChoice, RunState } from '../types';

export const initialRunState: RunState = {
  health: 100,
  gold: 50,
  population: 1,
  usedPopulation: 0,
  waveNumber: 1,
  bench: [
    createBenchUnit('axe-warrior'),
    createBenchUnit('frost-shaman'),
    createBenchUnit('wolf-rider'),
  ],
  unlockedUnitIds: ['axe-warrior', 'frost-shaman', 'wolf-rider'],
  ownedTotemIds: [],
};

export function autoMergeRunState(state: RunState): RunState {
  let nextState = state;

  while (true) {
    const result = mergeBenchUnits(nextState.bench);
    if (!result.merged) {
      return nextState;
    }
    nextState = {
      ...nextState,
      bench: result.bench,
    };
  }
}

export function advanceAfterVictory(state: RunState): RunState {
  return {
    ...state,
    waveNumber: state.waveNumber + 1,
    gold: state.gold + 40,
  };
}

export function applyRewardChoice(state: RunState, reward: RewardChoice): RunState {
  let nextState: RunState;

  if (reward.kind === 'economy') {
    nextState = {
      ...state,
      gold: state.gold + 20,
      population: state.population + 1,
    };
  } else if (reward.kind === 'totem') {
    nextState = {
      ...state,
      ownedTotemIds: Array.from(new Set([...state.ownedTotemIds, reward.id])),
    };
  } else {
    nextState = {
      ...state,
      bench: [...state.bench, createBenchUnit(reward.id)],
      unlockedUnitIds: Array.from(new Set([...state.unlockedUnitIds, reward.id])),
    };
  }

  return autoMergeRunState(nextState);
}
