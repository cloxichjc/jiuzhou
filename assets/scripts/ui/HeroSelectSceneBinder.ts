import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { HeroSelectController, type HeroCardView } from './HeroSelectController';
import { createChip, createInkImage, createLabel, createPanel, theme } from './kit';

const { ccclass } = _decorator;

const CARD_WIDTH = 620;
const CARD_HEIGHT = 280;
const CARD_TOP_Y = 400;
const CARD_GAP = 40;

/** 主角选择：三张大卡（立绘 + 性格 + 技能），点选后进入章节。 */
@ccclass('HeroSelectSceneBinder')
export class HeroSelectSceneBinder extends Component {
  readonly controller = new HeroSelectController();

  onLoad(): void {
    bindRouterToDirector();

    this.node.addChild(createInkImage('art/bg_paper', { width: 720, height: 1280, name: 'Background' }));

    const title = createLabel(this.controller.getScreenTitle(), { fontSize: theme.fontSize.heading, name: 'ScreenTitle' });
    title.setPosition(0, 560);
    this.node.addChild(title);

    this.controller.getHeroCards().forEach((card, index) => {
      const y = CARD_TOP_Y - index * (CARD_HEIGHT + CARD_GAP);
      this.node.addChild(this.buildHeroCard(card, y));
    });
  }

  onSelectHero(heroId: string): void {
    this.controller.chooseHero(heroId);
  }

  private buildHeroCard(card: HeroCardView, centerY: number) {
    const panel = createPanel({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      name: `HeroCard_${card.id}`,
      borderColor: card.selected ? theme.colors.cinnabar : theme.colors.inkLight,
      borderWidth: card.selected ? 4 : 2,
      radius: 14
    });
    panel.setPosition(0, centerY);

    const portrait = createInkImage(`art/portrait_${card.id}`, { width: 190, height: 190, name: 'Portrait' });
    portrait.setPosition(-190, 0);
    panel.addChild(portrait);

    const name = createLabel(card.name, { fontSize: theme.fontSize.heading, name: 'NameLabel' });
    name.setPosition(60, 84);
    panel.addChild(name);

    const skillChip = createChip({ text: card.skillName, color: theme.colors.cinnabar, name: 'SkillChip' });
    skillChip.setPosition(20, 32);
    panel.addChild(skillChip);

    const summary = createLabel(card.summary, {
      fontSize: theme.fontSize.small,
      color: theme.colors.inkLight,
      name: 'SummaryLabel'
    });
    summary.setPosition(60, -26);
    panel.addChild(summary);

    const hint = createLabel('点击选择', { fontSize: theme.fontSize.small, color: theme.colors.inkLight });
    hint.setPosition(60, -86);
    panel.addChild(hint);

    panel.on('touch-end', () => this.onSelectHero(card.id));
    return panel;
  }
}
