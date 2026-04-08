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

const heroSummaries: Record<string, string> = {
  asu: '隐忍的北陆世子，偏向团队防守。',
  jiye: '锋利的少年武士，偏向正面突击。',
  yuran: '灵动的羽族少女，偏向机动压制。'
};

const heroSkillNames: Record<string, string> = {
  asu: '苍狼祝祷',
  jiye: '虎牙破阵',
  yuran: '风羽回旋'
};

@ccclass('HeroSelectController')
export class HeroSelectController extends Component {
  getHeroCards(): HeroCardView[] {
    const save = getAppState().save;

    return loadHeroes().map((hero) => ({
      id: hero.id,
      name: hero.name,
      summary: heroSummaries[hero.id],
      skillName: heroSkillNames[hero.id],
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
