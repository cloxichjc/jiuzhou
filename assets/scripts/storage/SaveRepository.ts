import type { SaveData } from '../data/GameTypes';

export class SaveRepository {
  createDefault(): SaveData {
    return {
      selectedHeroId: null,
      unlockedHeroIds: [],
      clearedStageIds: []
    };
  }

  completeStage(save: SaveData, stageId: string, unlockedHeroId?: string): SaveData {
    const unlockedHeroIds = unlockedHeroId
      ? Array.from(new Set([...save.unlockedHeroIds, unlockedHeroId]))
      : save.unlockedHeroIds;

    return {
      ...save,
      clearedStageIds: Array.from(new Set([...save.clearedStageIds, stageId])),
      unlockedHeroIds
    };
  }
}
