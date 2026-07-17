import { _decorator, Component, Node } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { MainMenuController } from './MainMenuController';
import { createButton, createInkDivider, createInkImage, createLabel, theme } from './kit';
import { hbox } from './kit/layout';

const { ccclass } = _decorator;

/** 主菜单：宣纸底、大题字、三位主角群像、开始/继续。 */
@ccclass('MainMenuSceneBinder')
export class MainMenuSceneBinder extends Component {
  readonly controller = new MainMenuController();

  onLoad(): void {
    bindRouterToDirector();

    this.node.addChild(createInkImage('art/bg_paper', { width: 720, height: 1280, name: 'Background' }));

    const title = createLabel(this.controller.getTitle(), { fontSize: 72, name: 'TitleLabel' });
    title.setPosition(0, 330);
    this.node.addChild(title);

    const divider = createInkDivider(360);
    divider.setPosition(0, 268);
    this.node.addChild(divider);

    const subtitle = createLabel(this.controller.getSubtitle(), {
      fontSize: theme.fontSize.small,
      color: theme.colors.inkLight,
      name: 'SubtitleLabel'
    });
    subtitle.setPosition(0, 222);
    this.node.addChild(subtitle);

    // 三位主角群像（水墨立绘一字排开，点出「这是他们的故事」）
    const portraitRects = hbox({ x: -240, y: 40, height: 160, itemWidths: [160, 160, 160], spacing: 10 });
    ['asu', 'jiye', 'yuran'].forEach((heroId, index) => {
      const portrait = createInkImage(`art/portrait_${heroId}`, {
        width: 150,
        height: 150,
        name: `HeroPortrait_${heroId}`
      });
      portrait.setPosition(portraitRects[index].x, portraitRects[index].y);
      this.node.addChild(portrait);
    });

    const start = createButton('开始游戏', {
      width: 320,
      height: 88,
      name: 'StartButton',
      onTap: () => this.onStartTap()
    });
    start.node.setPosition(0, -180);
    this.node.addChild(start.node);

    const continueButton = createButton('继续游戏', {
      width: 320,
      height: 88,
      name: 'ContinueButton',
      fill: theme.colors.indigo,
      onTap: () => this.onContinueTap()
    });
    continueButton.node.setPosition(0, -296);
    continueButton.setEnabled(this.controller.canContinue());
    this.node.addChild(continueButton.node);
  }

  onStartTap(): void {
    this.controller.startGame();
  }

  onContinueTap(): void {
    this.controller.continueGame();
  }
}
