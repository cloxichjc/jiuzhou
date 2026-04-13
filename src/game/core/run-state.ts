import { createBenchUnit, createBoardSlots, getBenchUnitOrThrow } from './helpers';
import { mergeBenchUnits } from './merge';
import type { BenchUnit, BoardSlot, RewardChoice, RunState } from '../types';

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
  boardSlots: createBoardSlots(3),
  unlockedUnitIds: ['axe-warrior', 'frost-shaman', 'wolf-rider'],
  ownedTotemIds: [],
};

function syncBoardSlots(boardSlots: BoardSlot[], bench: BenchUnit[]): BoardSlot[] {
  const liveIds = new Set(bench.map((unit) => unit.instanceId));
  return boardSlots.map((slot) => (slot && liveIds.has(slot) ? slot : null));
}

function reconcileMergeIntoBoardSlots(
  boardSlots: BoardSlot[],
  consumedIds: string[],
  mergedUnitId: string
): BoardSlot[] {
  const nextSlots = [...boardSlots];
  const consumedSet = new Set(consumedIds);
  const firstConsumedSlotIndex = nextSlots.findIndex((slot) => slot !== null && consumedSet.has(slot));

  for (let index = 0; index < nextSlots.length; index += 1) {
    if (nextSlots[index] !== null && consumedSet.has(nextSlots[index]!)) {
      nextSlots[index] = null;
    }
  }

  if (firstConsumedSlotIndex >= 0) {
    nextSlots[firstConsumedSlotIndex] = mergedUnitId;
  }

  return nextSlots;
}

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
      boardSlots: result.mergedUnit && result.consumedIds
        ? reconcileMergeIntoBoardSlots(
            nextState.boardSlots,
            result.consumedIds,
            result.mergedUnit.instanceId
          )
        : syncBoardSlots(nextState.boardSlots, result.bench),
    };
  }
}

export function getDeployedUnits(state: RunState): BenchUnit[] {
  return state.boardSlots
    .map((instanceId) => {
      if (!instanceId) {
        return null;
      }
      return state.bench.find((unit) => unit.instanceId === instanceId) ?? null;
    })
    .filter((unit): unit is BenchUnit => unit !== null);
}

export function assignBoardSlot(state: RunState, instanceId: string, slotIndex: number): RunState {
  if (slotIndex < 0 || slotIndex >= state.population || slotIndex >= state.boardSlots.length) {
    return state;
  }

  getBenchUnitOrThrow(state.bench, instanceId);

  const nextSlots = state.boardSlots.map((slot) => (slot === instanceId ? null : slot));
  nextSlots[slotIndex] = instanceId;

  return {
    ...state,
    boardSlots: nextSlots,
    usedPopulation: nextSlots.filter((slot) => slot !== null).length,
  };
}

export function clearBoardSlot(state: RunState, slotIndex: number): RunState {
  if (slotIndex < 0 || slotIndex >= state.boardSlots.length) {
    return state;
  }

  const nextSlots = [...state.boardSlots];
  nextSlots[slotIndex] = null;

  return {
    ...state,
    boardSlots: nextSlots,
    usedPopulation: nextSlots.filter((slot) => slot !== null).length,
  };
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
      boardSlots: state.population < state.boardSlots.length
        ? state.boardSlots
        : [...state.boardSlots, null],
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

  const mergedState = autoMergeRunState(nextState);
  return {
    ...mergedState,
    boardSlots: syncBoardSlots(mergedState.boardSlots, mergedState.bench),
    usedPopulation: syncBoardSlots(mergedState.boardSlots, mergedState.bench).filter((slot) => slot !== null).length,
  };
}
