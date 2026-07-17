import { describe, expect, it } from 'vitest';
import { clearStage, createAppState, selectHero } from '../../assets/scripts/app/AppState';
import { loadStages } from '../../assets/scripts/data/loadConfig';

describe('MVP flow', () => {
  it('unlocks protagonists in chapter order and clears all five stages', () => {
    let state = createAppState();
    state = selectHero(state, 'asu');

    const stages = loadStages();

    for (const stage of stages) {
      state = clearStage(state, stage.id, stage.unlockHeroId);
    }

    expect(state.save.selectedHeroId).toBe('asu');
    expect(state.save.clearedStageIds).toEqual(stages.map((stage) => stage.id));
    expect(state.save.unlockedHeroIds).toEqual(['asu', 'jiye', 'yuran']);
  });
});
