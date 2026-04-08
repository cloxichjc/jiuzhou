import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { getAppState, resetAppState } from '../app/AppState';

const { ccclass } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  startGame(): void {
    resetAppState();
    appRouter.go('HeroSelect');
  }

  continueGame(): void {
    const save = getAppState().save;
    appRouter.go(save.selectedHeroId ? 'Chapter' : 'HeroSelect');
  }
}
