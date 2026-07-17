import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { ResultController } from './ResultController';
import { createButton, createInkImage, createLabel, createPanel, theme } from './kit';

const { ccclass } = _decorator;

/** 结算页：胜=朱砂墨章「胜」，败=灰墨「败」，附总结与主按钮。 */
@ccclass('ResultSceneBinder')
export class ResultSceneBinder extends Component {
  readonly controller = new ResultController();

  onLoad(): void {
    bindRouterToDirector();

    const won = appRouter.payload.result === 'won';
    const sealColor = won ? theme.colors.cinnabar : theme.colors.inkLight;

    this.node.addChild(createInkImage('art/bg_paper', { width: 720, height: 1280, name: 'Background' }));

    const bloom = createInkImage('art/ink_bloom', { width: 300, height: 300, name: 'SealBloom', fallbackFill: null });
    bloom.setPosition(0, 300);
    this.node.addChild(bloom);

    const seal = createLabel(won ? '胜' : '败', { fontSize: 120, color: sealColor, name: 'ResultSeal' });
    seal.setPosition(0, 300);
    this.node.addChild(seal);

    const title = createLabel(this.controller.getTitle(), { fontSize: theme.fontSize.heading, name: 'ResultTitle' });
    title.setPosition(0, 100);
    this.node.addChild(title);

    const summaryPanel = createPanel({ width: 620, height: 130, name: 'SummaryPanel', radius: 12 });
    summaryPanel.setPosition(0, -50);
    this.node.addChild(summaryPanel);
    const summary = createLabel(this.controller.getSummary(), {
      fontSize: theme.fontSize.small,
      color: theme.colors.inkLight,
      name: 'SummaryLabel'
    });
    summaryPanel.addChild(summary);

    const primary = createButton(this.controller.getPrimaryButtonLabel(), {
      width: 320,
      height: 88,
      name: 'PrimaryButton',
      onTap: () => this.onPrimaryTap()
    });
    primary.node.setPosition(0, -250);
    this.node.addChild(primary.node);
  }

  onPrimaryTap(): void {
    this.controller.next();
  }
}
