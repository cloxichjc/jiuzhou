import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { getAppState, resetAppState } from '../app/AppState';

const { ccclass } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  getTitle(): string {
    return '九州·缥缈录';
  }

  getSubtitle(): string {
    return '单机剧情向轻自走棋 MVP';
  }

  canContinue(): boolean {
    return Boolean(getAppState().save.selectedHeroId);
  }

  startGame(): void {
    resetAppState();
    appRouter.go('HeroSelect');
  }

  continueGame(): void {
    const save = getAppState().save;
    appRouter.go(save.selectedHeroId ? 'Chapter' : 'HeroSelect');
  }
}
