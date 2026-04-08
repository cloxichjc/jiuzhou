import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { getButton, getLabel } from './SceneBindingUtils';
import { ChapterController } from './ChapterController';

const { ccclass } = _decorator;

@ccclass('ChapterSceneBinder')
export class ChapterSceneBinder extends Component {
  private readonly controller = new ChapterController();

  onLoad(): void {
    bindRouterToDirector();
    this.refresh();
  }

  refresh(): void {
    const cards = this.controller.getStageCards();
    getLabel(this.node, 'ScreenTitle').string = this.controller.getScreenTitle();
    getLabel(this.node, 'ProgressLabel').string = this.controller.getProgressText();

    cards.forEach((card, index) => {
      const basePath = `StageCard_${index + 1}`;
      getLabel(this.node, `${basePath}/TitleLabel`).string = card.title;
      getLabel(this.node, `${basePath}/StoryLabel`).string = card.storyBefore;
      getLabel(this.node, `${basePath}/StatusLabel`).string = card.status;
      getButton(this.node, `${basePath}/PlayButton`).interactable = card.status === 'playable';
    });
  }

  onPlayStage(_event?: Event, stageId?: string): void {
    if (!stageId) {
      return;
    }

    this.controller.playStage(stageId);
  }
}
