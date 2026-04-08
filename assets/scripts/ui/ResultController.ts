import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { getStageById, loadStages } from '../data/loadConfig';

const { ccclass } = _decorator;

@ccclass('ResultController')
export class ResultController extends Component {
  getTitle(): string {
    return appRouter.payload.result === 'won' ? '战斗胜利' : '战斗失败';
  }

  getSummary(): string {
    const stageId = appRouter.payload.stageId;
    const stage = stageId ? getStageById(stageId) : undefined;

    if (!stage) {
      return '返回章节继续推进故事。';
    }

    if (appRouter.payload.result !== 'won') {
      return `你在 ${stage.title} 失利了，调整站位和技能时机后再试一次。`;
    }

    const isFinalStage = stage.id === loadStages()[loadStages().length - 1]?.id;
    return isFinalStage
      ? `${stage.storyAfter} 第一章已完成。`
      : `${stage.storyAfter} 下一位同行者正在等待加入。`;
  }

  next(): void {
    appRouter.go('Chapter');
  }
}
