export type SceneName = 'MainMenu' | 'HeroSelect' | 'Chapter' | 'Battle' | 'Result';

export interface RoutePayload {
  stageId?: string;
  result?: 'won' | 'lost';
}

export class AppRouter {
  currentScene: SceneName = 'MainMenu';
  payload: RoutePayload = {};

  go(scene: SceneName, payload: RoutePayload = {}): void {
    this.currentScene = scene;
    this.payload = payload;
  }
}

export const appRouter = new AppRouter();
