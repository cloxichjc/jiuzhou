import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { getLabel, getNodeByPath } from './SceneBindingUtils';
import { HeroSelectController } from './HeroSelectController';

const { ccclass } = _decorator;

@ccclass('HeroSelectSceneBinder')
export class HeroSelectSceneBinder extends Component {
  private readonly controller = new HeroSelectController();

  onLoad(): void {
    bindRouterToDirector();
    this.refresh();
  }

  refresh(): void {
    const cards = this.controller.getHeroCards();
    getLabel(this.node, 'ScreenTitle').string = this.controller.getScreenTitle();

    cards.forEach((card) => {
      const basePath = `HeroCard_${card.id}`;
      getLabel(this.node, `${basePath}/NameLabel`).string = card.name;
      getLabel(this.node, `${basePath}/SummaryLabel`).string = card.summary;
      getLabel(this.node, `${basePath}/SkillLabel`).string = card.skillName;
      getNodeByPath(this.node, `${basePath}/SelectedBadge`).active = card.selected;
    });
  }

  onSelectHero(_event?: Event, heroId?: string): void {
    if (!heroId) {
      return;
    }

    this.controller.chooseHero(heroId);
  }
}
