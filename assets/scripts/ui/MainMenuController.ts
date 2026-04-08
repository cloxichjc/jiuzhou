import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';

const { ccclass } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
  startGame(): void {
    appRouter.go('HeroSelect');
  }

  continueGame(): void {
    appRouter.go('Chapter');
  }
}
