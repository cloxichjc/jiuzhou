import { describe, expect, it } from 'vitest';
import { Label, Node, director } from 'cc';
import { clearStage, createAppState, resetAppState, selectHero, setAppState } from '../../assets/scripts/app/AppState';
import { appRouter } from '../../assets/scripts/app/AppRouter';
import { bindRouterToDirector } from '../../assets/scripts/app/CocosSceneNavigator';
import { MainMenuSceneBinder } from '../../assets/scripts/ui/MainMenuSceneBinder';
import { HeroSelectSceneBinder } from '../../assets/scripts/ui/HeroSelectSceneBinder';
import { ChapterSceneBinder } from '../../assets/scripts/ui/ChapterSceneBinder';
import { ResultSceneBinder } from '../../assets/scripts/ui/ResultSceneBinder';
import { BattleSceneBinder } from '../../assets/scripts/ui/BattleSceneBinder';

function attachComponent<T extends object>(node: Node, component: T): T {
  Object.assign(component, { node });
  node.addComponentInstance(component);
  return component;
}

function findByName(root: Node, name: string): Node | null {
  if (root.name === name) return root;
  for (const child of root.children) {
    const found = findByName(child, name);
    if (found) return found;
  }
  return null;
}

function labelText(root: Node, name: string): string | undefined {
  return findByName(root, name)?.getComponent(Label)?.string;
}

function chipText(card: Node | null, chipName: string): string | undefined {
  if (!card) return undefined;
  return findByName(card, chipName)?.getChildByName('Label')?.getComponent(Label)?.string;
}

function tap(node: Node | null): void {
  node?.emit(Node.EventType.TOUCH_START);
  node?.emit(Node.EventType.TOUCH_END);
}

describe('scene binders', () => {
  it('router bridge loads cocos scenes when route changes', () => {
    director.reset();
    bindRouterToDirector();

    appRouter.go('HeroSelect');

    expect(director.loadedScenes).toEqual(['HeroSelect']);
  });

  it('main menu builds its UI in code and routes on taps', () => {
    director.reset();
    resetAppState();
    setAppState(selectHero(createAppState(), 'asu'));

    const root = new Node('MainMenu');
    const binder = attachComponent(root, new MainMenuSceneBinder());
    binder.onLoad();

    expect(labelText(root, 'TitleLabel')).toBe('九州·缥缈录');
    expect(labelText(root, 'SubtitleLabel')).toContain('MVP');
    expect(findByName(root, 'HeroPortrait_asu')).not.toBeNull();

    tap(findByName(root, 'ContinueButton'));
    expect(appRouter.currentScene).toBe('Chapter');

    tap(findByName(root, 'StartButton'));
    expect(appRouter.currentScene).toBe('HeroSelect');
  });

  it('hero select builds three cards and choosing one routes to chapter', () => {
    director.reset();
    resetAppState();

    const root = new Node('HeroSelect');
    const binder = attachComponent(root, new HeroSelectSceneBinder());
    binder.onLoad();

    expect(labelText(root, 'ScreenTitle')).toBe('选择你的主角');
    expect(findByName(root, 'HeroCard_asu')).not.toBeNull();
    expect(findByName(root, 'HeroCard_jiye')).not.toBeNull();
    expect(findByName(root, 'HeroCard_yuran')).not.toBeNull();

    tap(findByName(root, 'HeroCard_jiye'));

    expect(appRouter.currentScene).toBe('Chapter');
    expect(appRouter.payload).toEqual({});
  });

  it('chapter lists five stages with chinese status chips and only playable taps through', () => {
    director.reset();
    resetAppState();
    let state = createAppState();
    state = selectHero(state, 'asu');
    state = clearStage(state, 'stage-1');
    setAppState(state);

    const root = new Node('Chapter');
    const binder = attachComponent(root, new ChapterSceneBinder());
    binder.onLoad();

    expect(labelText(root, 'ScreenTitle')).toContain('第一章');
    expect(labelText(root, 'ProgressLabel')).toBe('已通关 1 / 5 关');
    expect(chipText(findByName(root, 'StageCard_stage-1'), 'StatusChip')).toBe('已通关');
    expect(chipText(findByName(root, 'StageCard_stage-2'), 'StatusChip')).toBe('可挑战');
    expect(chipText(findByName(root, 'StageCard_stage-3'), 'StatusChip')).toBe('未解锁');

    tap(findByName(root, 'StageCard_stage-3'));
    expect(appRouter.currentScene).not.toBe('Battle');

    tap(findByName(root, 'StageCard_stage-2'));
    expect(appRouter.currentScene).toBe('Battle');
    expect(appRouter.payload.stageId).toBe('stage-2');
  });

  it('result shows the seal and primary action routes back', () => {
    director.reset();
    appRouter.go('Result', { stageId: 'stage-5', result: 'won' });

    const root = new Node('Result');
    const binder = attachComponent(root, new ResultSceneBinder());
    binder.onLoad();

    expect(labelText(root, 'ResultSeal')).toBe('胜');
    expect(labelText(root, 'ResultTitle')).toBe('战斗胜利');
    expect(labelText(root, 'SummaryLabel')).toContain('第一章已完成');

    tap(findByName(root, 'PrimaryButton'));
    expect(appRouter.currentScene).toBe('Chapter');
  });

  it('battle binder builds the board, units and skill button from code', () => {
    director.reset();
    resetAppState();
    setAppState(selectHero(createAppState(), 'asu'));
    appRouter.go('Battle', { stageId: 'stage-1' });

    const root = new Node('Battle');
    const binder = attachComponent(root, new BattleSceneBinder());
    binder.onLoad();

    expect(labelText(root, 'StageTitle')).toBe('乱世来客');
    expect(labelText(root, 'WaveLabel')).toBe('第 1 / 1 波');
    expect(labelText(root, 'StoryText')).toContain('乱世');
    expect(findByName(root, 'BoardCells_Enemy')).not.toBeNull();
    expect(findByName(root, 'BoardCells_Ally')).not.toBeNull();
    expect(findByName(root, 'Unit_asu')).not.toBeNull();
    expect(findByName(root, 'Unit_bandit-melee')).not.toBeNull();
    expect(findByName(root, 'SkillButton')?.getChildByName('Label')?.getComponent(Label)?.string).toBe('苍狼祝祷');
  });

  it('battle binder plays the skill effect once and finishes the stage', () => {
    director.reset();
    resetAppState();
    setAppState(selectHero(createAppState(), 'asu'));
    appRouter.go('Battle', { stageId: 'stage-1' });

    const root = new Node('Battle');
    const binder = attachComponent(root, new BattleSceneBinder());
    binder.onLoad();

    binder.onUseSkillTap();
    expect(binder.controller.skillUsed).toBe(true);

    binder.update(0.1);
    expect(findByName(root, 'SkillEffect')).not.toBeNull();

    let guard = 0;
    while (binder.controller.battleState.phase !== 'won' && binder.controller.battleState.phase !== 'lost') {
      binder.update(0.5);
      guard += 1;
      if (guard > 200) throw new Error('battle did not terminate');
    }
    binder.update(0.1);

    expect(binder.controller.battleState.phase).toBe('won');
    expect(director.loadedScenes).toContain('Result');
    expect(appRouter.payload).toMatchObject({ stageId: 'stage-1', result: 'won' });
  });
});
