import { describe, expect, it } from 'vitest';
import { SaveRepository } from '../../assets/scripts/storage/SaveRepository';

class FakeStorage {
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

describe('SaveRepository', () => {
  it('creates the default save for a first-time player', () => {
    const repo = new SaveRepository(new FakeStorage());
    const save = repo.createDefault();

    expect(save.selectedHeroId).toBeNull();
    expect(save.unlockedHeroIds).toEqual([]);
    expect(save.clearedStageIds).toEqual([]);
  });

  it('marks a stage cleared and unlocks the next hero when requested', () => {
    const repo = new SaveRepository(new FakeStorage());
    const updated = repo.completeStage(repo.createDefault(), 'stage-2', 'jiye');

    expect(updated.clearedStageIds).toContain('stage-2');
    expect(updated.unlockedHeroIds).toContain('jiye');
  });

  it('persists and reloads save data', () => {
    const storage = new FakeStorage();
    const repo = new SaveRepository(storage);
    const save = repo.completeStage(repo.createDefault(), 'stage-3', 'yuran');
    save.selectedHeroId = 'asu';

    repo.save(save);

    expect(repo.load()).toEqual(save);
  });
});
