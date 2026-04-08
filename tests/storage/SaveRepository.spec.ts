import { describe, expect, it } from 'vitest';
import { SaveRepository } from '../../assets/scripts/storage/SaveRepository';

describe('SaveRepository', () => {
  it('creates the default save for a first-time player', () => {
    const repo = new SaveRepository();
    const save = repo.createDefault();

    expect(save.selectedHeroId).toBeNull();
    expect(save.unlockedHeroIds).toEqual([]);
    expect(save.clearedStageIds).toEqual([]);
  });

  it('marks a stage cleared and unlocks the next hero when requested', () => {
    const repo = new SaveRepository();
    const updated = repo.completeStage(repo.createDefault(), 'stage-2', 'jiye');

    expect(updated.clearedStageIds).toContain('stage-2');
    expect(updated.unlockedHeroIds).toContain('jiye');
  });
});
