import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { getLabel } from './SceneBindingUtils';
import { ResultController } from './ResultController';

const { ccclass } = _decorator;

@ccclass('ResultSceneBinder')
export class ResultSceneBinder extends Component {
  private readonly controller = new ResultController();

  onLoad(): void {
    bindRouterToDirector();
    this.refresh();
  }

  refresh(): void {
    getLabel(this.node, 'ResultTitle').string = this.controller.getTitle();
    getLabel(this.node, 'SummaryLabel').string = this.controller.getSummary();
    getLabel(this.node, 'PrimaryButtonLabel').string = this.controller.getPrimaryButtonLabel();
  }

  onPrimaryTap(): void {
    this.controller.next();
  }
}
