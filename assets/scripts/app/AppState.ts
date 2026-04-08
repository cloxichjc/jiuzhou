import type { SaveData } from '../data/GameTypes';
import { SaveRepository } from '../storage/SaveRepository';

export interface RootState {
  save: SaveData;
}

const repository = new SaveRepository();

let appState: RootState = {
  save: repository.createDefault()
};

export function createAppState(): RootState {
  return {
    save: repository.createDefault()
  };
}

export function selectHero(state: RootState, heroId: string): RootState {
  return {
    save: {
      ...state.save,
      selectedHeroId: heroId,
      unlockedHeroIds: Array.from(new Set([...state.save.unlockedHeroIds, heroId]))
    }
  };
}

export function clearStage(state: RootState, stageId: string, unlockedHeroId?: string): RootState {
  return {
    save: repository.completeStage(state.save, stageId, unlockedHeroId)
  };
}

export function getAppState(): RootState {
  return appState;
}

export function setAppState(nextState: RootState): RootState {
  appState = nextState;
  return appState;
}
