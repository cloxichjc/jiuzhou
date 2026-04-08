import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import type { BattleUnitView } from './BattleController';
import { BattleController } from './BattleController';
import { getButton, getLabel, getNodeByPath } from './SceneBindingUtils';

const { ccclass } = _decorator;

const unitDisplayNames: Record<string, string> = {
  asu: '阿苏勒',
  jiye: '姬野',
  yuran: '羽然',
  'bandit-melee': '山贼刀手',
  'bandit-ranged': '山贼弓手',
  'bandit-shield': '山贼盾卫',
  'elite-guard': '精锐护卫',
  captain: '首领'
};

@ccclass('BattleSceneBinder')
export class BattleSceneBinder extends Component {
  private readonly controller = new BattleController();

  onLoad(): void {
    bindRouterToDirector();
    this.controller.onLoad();
    this.refresh();
  }

  update(deltaTime: number): void {
    this.controller.update(deltaTime);
    this.refresh();
  }

  refresh(): void {
    getLabel(this.node, 'StageTitle').string = this.controller.getStageTitle();
    getLabel(this.node, 'StoryText').string = this.controller.getStoryText();
    getLabel(this.node, 'WaveLabel').string = this.controller.getWaveLabel();
    getLabel(this.node, 'SkillButtonLabel').string = this.controller.getSkillLabel();
    getButton(this.node, 'SkillButton').interactable = this.controller.canUseSkill();
    this.renderUnits('AlliesPanel', this.controller.getAlliesView());
    this.renderUnits('EnemiesPanel', this.controller.getEnemiesView());
  }

  onUseSkillTap(): void {
    this.controller.useSkill();
    this.refresh();
  }

  private renderUnits(panelPath: string, units: BattleUnitView[]): void {
    for (let index = 0; index < 3; index += 1) {
      const nodePath = `${panelPath}/Unit_${index + 1}`;
      const unit = units[index];
      const unitNode = getNodeByPath(this.node, nodePath);
      unitNode.active = Boolean(unit);

      if (!unit) {
        continue;
      }

      getLabel(this.node, `${nodePath}/NameLabel`).string = unitDisplayNames[unit.id] ?? unit.id;
      getLabel(this.node, `${nodePath}/HpLabel`).string = unit.alive ? `HP ${unit.hp}` : '已倒下';
    }
  }
}
