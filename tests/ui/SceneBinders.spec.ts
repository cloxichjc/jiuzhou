import { describe, expect, it } from 'vitest';
import { Button, Label, Node, director } from 'cc';
import { createAppState, resetAppState, selectHero, setAppState } from '../../assets/scripts/app/AppState';
import { appRouter } from '../../assets/scripts/app/AppRouter';
import { bindRouterToDirector } from '../../assets/scripts/app/CocosSceneNavigator';
import { MainMenuSceneBinder } from '../../assets/scripts/ui/MainMenuSceneBinder';
import { BattleSceneBinder } from '../../assets/scripts/ui/BattleSceneBinder';

function attachComponent<T extends object>(node: Node, component: T): T {
  Object.assign(component, { node });
  node.addComponentInstance(component);
  return component;
}

function addNode(root: Node, path: string): Node {
  const segments = path.split('/');
  let current = root;

  for (const segment of segments) {
    let child = current.getChildByName(segment);
    if (!child) {
      child = new Node(segment);
      current.addChild(child);
    }
    current = child;
  }

  return current;
}

function addLabel(root: Node, path: string): Label {
  return attachComponent(addNode(root, path), new Label());
}

function addButton(root: Node, path: string): Button {
  return attachComponent(addNode(root, path), new Button());
}

describe('scene binders', () => {
  it('router bridge loads cocos scenes when route changes', () => {
    director.reset();
    bindRouterToDirector();

    appRouter.go('HeroSelect');

    expect(director.loadedScenes).toEqual(['HeroSelect']);
  });

  it('main menu binder hydrates labels and routes on button tap', () => {
    resetAppState();
    setAppState(selectHero(createAppState(), 'asu'));
    director.reset();

    const root = new Node('MainMenu');
    const titleLabel = addLabel(root, 'TitleLabel');
    const subtitleLabel = addLabel(root, 'SubtitleLabel');
    const continueButton = addButton(root, 'ContinueButton');
    const binder = attachComponent(root, new MainMenuSceneBinder());

    binder.onLoad();

    expect(titleLabel.string).toBe('九州·缥缈录');
    expect(subtitleLabel.string).toBe('单机剧情向轻自走棋 MVP');
    expect(continueButton.interactable).toBe(true);

    binder.onStartTap();

    expect(appRouter.currentScene).toBe('HeroSelect');
    expect(director.loadedScenes[director.loadedScenes.length - 1]).toBe('HeroSelect');
  });

  it('battle binder renders battle hud and disables skill after use', () => {
    director.reset();
    let state = createAppState();
    state = selectHero(state, 'asu');
    setAppState(state);
    appRouter.go('Battle', { stageId: 'stage-1' });

    const root = new Node('Battle');
    const stageTitle = addLabel(root, 'StageTitle');
    const waveLabel = addLabel(root, 'WaveLabel');
    const storyText = addLabel(root, 'StoryText');
    const skillButton = addButton(root, 'SkillButton');
    const skillButtonLabel = addLabel(root, 'SkillButtonLabel');
    for (const path of [
      'AlliesPanel/Unit_1/NameLabel',
      'AlliesPanel/Unit_1/HpLabel',
      'AlliesPanel/Unit_2/NameLabel',
      'AlliesPanel/Unit_2/HpLabel',
      'AlliesPanel/Unit_3/NameLabel',
      'AlliesPanel/Unit_3/HpLabel',
      'EnemiesPanel/Unit_1/NameLabel',
      'EnemiesPanel/Unit_1/HpLabel',
      'EnemiesPanel/Unit_2/NameLabel',
      'EnemiesPanel/Unit_2/HpLabel',
      'EnemiesPanel/Unit_3/NameLabel',
      'EnemiesPanel/Unit_3/HpLabel'
    ]) {
      addLabel(root, path);
    }
    const binder = attachComponent(root, new BattleSceneBinder());

    binder.onLoad();

    expect(stageTitle.string).toBe('乱世来客');
    expect(waveLabel.string).toBe('第 1 / 1 波');
    expect(storyText.string).toContain('乱世');
    expect(skillButtonLabel.string).toBe('苍狼祝祷');
    expect(skillButton.interactable).toBe(true);

    binder.onUseSkillTap();

    expect(skillButton.interactable).toBe(false);
  });
});
