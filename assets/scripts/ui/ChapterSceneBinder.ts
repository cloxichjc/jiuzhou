import { _decorator, Component } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { ChapterController, type StageCardView } from './ChapterController';
import { createChip, createInkImage, createLabel, createPanel, theme } from './kit';

const { ccclass } = _decorator;

const CARD_WIDTH = 620;
const CARD_HEIGHT = 150;
const CARD_TOP_Y = 400;
const CARD_GAP = 24;

const statusMeta: Record<StageCardView['status'], { text: string; color: string }> = {
  cleared: { text: '已通关', color: theme.colors.gold },
  playable: { text: '可挑战', color: theme.colors.cinnabar },
  locked: { text: '未解锁', color: theme.colors.inkLight }
};

/** 章节页：5 关线性卷轴，状态用中文墨章，锁定关灰化。 */
@ccclass('ChapterSceneBinder')
export class ChapterSceneBinder extends Component {
  readonly controller = new ChapterController();

  onLoad(): void {
    bindRouterToDirector();

    this.node.addChild(createInkImage('art/bg_paper', { width: 720, height: 1280, name: 'Background' }));

    const title = createLabel(this.controller.getScreenTitle(), { fontSize: theme.fontSize.heading, name: 'ScreenTitle' });
    title.setPosition(0, 570);
    this.node.addChild(title);

    const progress = createLabel(this.controller.getProgressText(), {
      fontSize: theme.fontSize.small,
      color: theme.colors.inkLight,
      name: 'ProgressLabel'
    });
    progress.setPosition(0, 524);
    this.node.addChild(progress);

    this.controller.getStageCards().forEach((card, index) => {
      const y = CARD_TOP_Y - index * (CARD_HEIGHT + CARD_GAP);
      this.node.addChild(this.buildStageCard(card, y));
    });
  }

  onPlayStage(stageId: string): void {
    this.controller.playStage(stageId);
  }

  private buildStageCard(card: StageCardView, centerY: number) {
    const meta = statusMeta[card.status];
    const locked = card.status === 'locked';

    const panel = createPanel({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      name: `StageCard_${card.id}`,
      fill: locked ? theme.colors.paperDark : theme.colors.paper,
      borderColor: card.status === 'playable' ? theme.colors.cinnabar : theme.colors.inkLight,
      borderWidth: card.status === 'playable' ? 3 : 2,
      radius: 12
    });
    panel.setPosition(0, centerY);

    const title = createLabel(`第 ${card.id.replace('stage-', '')} 关 · ${card.title}`, {
      fontSize: theme.fontSize.body,
      color: locked ? theme.colors.inkLight : theme.colors.ink,
      name: 'TitleLabel'
    });
    title.setPosition(-150, 36);
    panel.addChild(title);

    const story = createLabel(card.storyBefore, {
      fontSize: theme.fontSize.small,
      color: theme.colors.inkLight,
      name: 'StoryLabel'
    });
    story.setPosition(-110, -24);
    panel.addChild(story);

    const chip = createChip({
      text: meta.text,
      color: meta.color,
      textColor: locked ? theme.colors.inkLight : meta.color,
      name: 'StatusChip'
    });
    chip.setPosition(230, 30);
    panel.addChild(chip);

    if (card.status === 'playable') {
      panel.on('touch-end', () => this.onPlayStage(card.id));
    }

    return panel;
  }
}
