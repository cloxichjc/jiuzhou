import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { BootController } from './BootController';

const { ccclass } = _decorator;

@ccclass('BootSceneBinder')
export class BootSceneBinder extends Component {
  private readonly controller = new BootController();

  onLoad(): void {
    bindRouterToDirector();
    this.controller.onLoad();
  }
}
