import { describe, expect, it } from 'vitest';
import { appRouter } from '../../assets/scripts/app/AppRouter';
import { createAppState, selectHero, setAppState, clearStage } from '../../assets/scripts/app/AppState';
import { BootController } from '../../assets/scripts/ui/BootController';
import { HeroSelectController } from '../../assets/scripts/ui/HeroSelectController';
import { ChapterController } from '../../assets/scripts/ui/ChapterController';
import { ResultController } from '../../assets/scripts/ui/ResultController';

describe('UI controller view models', () => {
  it('boot resets state and routes to main menu', () => {
    const boot = new BootController();
    appRouter.go('Battle', { stageId: 'stage-3' });

    boot.onLoad();

    expect(appRouter.currentScene).toBe('MainMenu');
  });

  it('hero select exposes three protagonist cards', () => {
    setAppState(createAppState());
    const controller = new HeroSelectController();

    const cards = controller.getHeroCards();

    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.name)).toEqual(['阿苏勒', '姬野', '羽然']);
  });

  it('chapter exposes a single playable stage until progress advances', () => {
    let state = createAppState();
    state = selectHero(state, 'asu');
    state = clearStage(state, 'stage-1');
    setAppState(state);

    const controller = new ChapterController();
    const cards = controller.getStageCards();

    expect(cards.find((card) => card.id === 'stage-1')?.status).toBe('cleared');
    expect(cards.find((card) => card.id === 'stage-2')?.status).toBe('playable');
    expect(cards.find((card) => card.id === 'stage-3')?.status).toBe('locked');
  });

  it('result summary shows chapter completion on the final stage', () => {
    const controller = new ResultController();
    appRouter.go('Result', { stageId: 'stage-5', result: 'won' });

    expect(controller.getTitle()).toBe('战斗胜利');
    expect(controller.getSummary()).toContain('第一章已完成');
  });
});
