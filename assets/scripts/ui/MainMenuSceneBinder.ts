import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { getButton, getLabel } from './SceneBindingUtils';
import { MainMenuController } from './MainMenuController';

const { ccclass } = _decorator;

@ccclass('MainMenuSceneBinder')
export class MainMenuSceneBinder extends Component {
  private readonly controller = new MainMenuController();

  onLoad(): void {
    bindRouterToDirector();
    this.refresh();
  }

  refresh(): void {
    getLabel(this.node, 'TitleLabel').string = this.controller.getTitle();
    getLabel(this.node, 'SubtitleLabel').string = this.controller.getSubtitle();
    getButton(this.node, 'ContinueButton').interactable = this.controller.canContinue();
  }

  onStartTap(): void {
    this.controller.startGame();
  }

  onContinueTap(): void {
    this.controller.continueGame();
  }
}
