import { describe, expect, it } from 'vitest';
import { appRouter } from '../../assets/scripts/app/AppRouter';
import { createAppState, selectHero, setAppState, clearStage, resetAppState, getAppState } from '../../assets/scripts/app/AppState';
import { BootController } from '../../assets/scripts/ui/BootController';
import { HeroSelectController } from '../../assets/scripts/ui/HeroSelectController';
import { ChapterController } from '../../assets/scripts/ui/ChapterController';
import { ResultController } from '../../assets/scripts/ui/ResultController';
import { MainMenuController } from '../../assets/scripts/ui/MainMenuController';
import { BattleController } from '../../assets/scripts/ui/BattleController';

describe('UI controller view models', () => {
  it('boot resets state and routes to main menu', () => {
    const boot = new BootController();
    appRouter.go('Battle', { stageId: 'stage-3' });

    boot.onLoad();

    expect(appRouter.currentScene).toBe('MainMenu');
  });

  it('continue game routes to hero select when no save exists', () => {
    resetAppState();
    const menu = new MainMenuController();

    menu.continueGame();

    expect(appRouter.currentScene).toBe('HeroSelect');
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

  it('battle keeps the hero skill limited to once across all waves and clears the stage', () => {
    let state = createAppState();
    state = selectHero(state, 'asu');
    setAppState(state);
    appRouter.go('Battle', { stageId: 'stage-5' });

    const controller = new BattleController();
    controller.onLoad();

    expect(controller.getStageTitle()).toBe('一生之盟');
    expect(controller.getWaveLabel()).toBe('第 1 / 2 波');
    expect(controller.getAlliesView().length).toBeGreaterThan(0);
    expect(controller.getEnemiesView().length).toBeGreaterThan(0);
    expect(controller.canUseSkill()).toBe(true);

    controller.useSkill();

    expect(controller.skillUsed).toBe(true);
    expect(controller.canUseSkill()).toBe(false);

    controller.battleState.phase = 'won';
    controller.update(0);

    expect(controller.waveIndex).toBe(1);
    expect(controller.skillUsed).toBe(true);

    controller.battleState.phase = 'won';
    controller.update(0);

    expect(appRouter.currentScene).toBe('Result');
    expect(appRouter.payload.result).toBe('won');
    expect(getAppState().save.clearedStageIds).toContain('stage-5');
  });
});
