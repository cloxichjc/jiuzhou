export type HeroRole = 'support' | 'fighter' | 'skirmisher';
export type HeroFaction = 'north' | 'east';

export interface HeroConfig {
  id: string;
  name: string;
  role: HeroRole;
  faction: HeroFaction;
  skillId: string;
}

export interface EnemyWaveConfig {
  id: string;
  enemies: Array<{ unitId: string; slot: number }>;
}

export interface StageConfig {
  id: string;
  title: string;
  storyBefore: string;
  storyAfter: string;
  unlockHeroId?: string;
  waves: EnemyWaveConfig[];
}

export interface SaveData {
  selectedHeroId: string | null;
  unlockedHeroIds: string[];
  clearedStageIds: string[];
}
