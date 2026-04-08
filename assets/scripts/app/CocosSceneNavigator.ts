import { director } from 'cc';
import { appRouter, type SceneNavigator } from './AppRouter';

const cocosSceneNavigator: SceneNavigator = {
  loadScene(scene) {
    director.loadScene(scene);
  }
};

export function bindRouterToDirector(): void {
  appRouter.setNavigator(cocosSceneNavigator);
}
