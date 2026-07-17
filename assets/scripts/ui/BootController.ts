import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { loadPersistedAppState, setAppState } from '../app/AppState';

const { ccclass } = _decorator;

@ccclass('BootController')
export class BootController extends Component {
  onLoad(): void {
    setAppState(loadPersistedAppState());
    appRouter.go('MainMenu');
  }
}
