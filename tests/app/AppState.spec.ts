import { describe, expect, it } from 'vitest';
import { clearStage, createAppState, selectHero } from '../../assets/scripts/app/AppState';

describe('AppState', () => {
  it('stores the selected hero', () => {
    const state = selectHero(createAppState(), 'asu');
    expect(state.save.selectedHeroId).toBe('asu');
    expect(state.save.unlockedHeroIds).toContain('asu');
  });

  it('clears a stage and unlocks the stage reward hero', () => {
    const state = clearStage(createAppState(), 'stage-2', 'jiye');
    expect(state.save.clearedStageIds).toContain('stage-2');
    expect(state.save.unlockedHeroIds).toContain('jiye');
  });
});
