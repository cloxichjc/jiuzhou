import { _decorator, Component } from 'cc';
import { appRouter } from '../app/AppRouter';
import { getAppState, selectHero, setAppState } from '../app/AppState';
import { loadHeroes } from '../data/loadConfig';

const { ccclass } = _decorator;

export interface HeroCardView {
  id: string;
  name: string;
  summary: string;
  skillName: string;
  selected: boolean;
}

@ccclass('HeroSelectController')
export class HeroSelectController extends Component {
  getHeroCards(): HeroCardView[] {
    const save = getAppState().save;

    return loadHeroes().map((hero) => ({
      id: hero.id,
      name: hero.name,
      summary: hero.summary,
      skillName: hero.skillName,
      selected: save.selectedHeroId === hero.id
    }));
  }

  getScreenTitle(): string {
    return '选择你的主角';
  }

  chooseHero(heroId: string): void {
    const state = getAppState();
    setAppState(selectHero(state, heroId));
    appRouter.go('Chapter');
  }
}
