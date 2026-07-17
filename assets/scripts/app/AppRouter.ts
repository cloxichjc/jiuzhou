export type SceneName = 'MainMenu' | 'HeroSelect' | 'Chapter' | 'Battle' | 'Result';

export interface RoutePayload {
  stageId?: string;
  result?: 'won' | 'lost';
}

export interface SceneNavigator {
  loadScene(scene: SceneName): void;
}

export class AppRouter {
  currentScene: SceneName = 'MainMenu';
  payload: RoutePayload = {};
  private navigator?: SceneNavigator;

  setNavigator(navigator?: SceneNavigator): void {
    this.navigator = navigator;
  }

  go(scene: SceneName, payload: RoutePayload = {}): void {
    this.currentScene = scene;
    this.payload = payload;
    this.navigator?.loadScene(scene);
  }
}

export const appRouter = new AppRouter();
