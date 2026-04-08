import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { createAppState, setAppState } from '../app/AppState';

const { ccclass } = _decorator;

@ccclass('BootController')
export class BootController extends Component {
  onLoad(): void {
    setAppState(createAppState());
    appRouter.go('MainMenu');
  }
}
