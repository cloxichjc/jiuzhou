export type HeroRole = 'support' | 'fighter' | 'skirmisher';
export type HeroFaction = 'north' | 'east';

export interface HeroConfig {
  id: string;
  name: string;
  role: HeroRole;
  faction: HeroFaction;
  skillId: string;
  /** 技能显示名，如「苍狼祝祷」 */
  skillName: string;
  /** 一句话性格介绍 */
  summary: string;
  /** 一句话技能说明 */
  skillSummary: string;
  hp: number;
  attack: number;
  attackIntervalMs: number;
}

export interface EnemyConfig {
  id: string;
  name: string;
  hp: number;
  attack: number;
  attackIntervalMs: number;
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
