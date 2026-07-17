import type { SaveData } from '../data/GameTypes';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

export class SaveRepository {
  private readonly storageKey = 'jiuzhou-mvp-save';
  private readonly storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? this.resolveStorage();
  }

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

  load(): SaveData {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      return this.createDefault();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        selectedHeroId: parsed.selectedHeroId ?? null,
        unlockedHeroIds: parsed.unlockedHeroIds ?? [],
        clearedStageIds: parsed.clearedStageIds ?? []
      };
    } catch {
      return this.createDefault();
    }
  }

  save(save: SaveData): SaveData {
    this.storage.setItem(this.storageKey, JSON.stringify(save));
    return save;
  }

  clear(): void {
    this.storage.removeItem(this.storageKey);
  }

  private resolveStorage(): StorageLike {
    const maybeStorage = globalThis as typeof globalThis & { localStorage?: StorageLike };
    return maybeStorage.localStorage ?? new MemoryStorage();
  }
}
