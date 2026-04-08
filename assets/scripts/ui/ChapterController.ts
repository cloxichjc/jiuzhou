import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { loadStages } from '../data/loadConfig';
import { getAppState } from '../app/AppState';

const { ccclass } = _decorator;

function nextPlayableStage(stageIds: string[], clearedStageIds: string[]): string {
  return stageIds.find((id) => !clearedStageIds.includes(id)) ?? stageIds[stageIds.length - 1];
}

export interface StageCardView {
  id: string;
  title: string;
  status: 'cleared' | 'playable' | 'locked';
  storyBefore: string;
}

@ccclass('ChapterController')
export class ChapterController extends Component {
  getStageCards(): StageCardView[] {
    const stages = loadStages();

    return stages.map((stage) => ({
      id: stage.id,
      title: stage.title,
      status: this.getStageStatus(stage.id),
      storyBefore: stage.storyBefore
    }));
  }

  playStage(stageId: string): void {
    const stages = loadStages();
    const allowedStageId = nextPlayableStage(
      stages.map((stage) => stage.id),
      getAppState().save.clearedStageIds
    );

    if (stageId !== allowedStageId) {
      return;
    }

    appRouter.go('Battle', { stageId });
  }

  getNextPlayableStageId(): string {
    const stages = loadStages();
    return nextPlayableStage(
      stages.map((stage) => stage.id),
      getAppState().save.clearedStageIds
    );
  }

  getStageStatus(stageId: string): 'cleared' | 'playable' | 'locked' {
    const stages = loadStages();
    const stageIds = stages.map((stage) => stage.id);
    const save = getAppState().save;
    const allowedStageId = nextPlayableStage(stageIds, save.clearedStageIds);

    if (save.clearedStageIds.includes(stageId)) {
      return 'cleared';
    }

    if (stageId === allowedStageId) {
      return 'playable';
    }

    return 'locked';
  }
}
