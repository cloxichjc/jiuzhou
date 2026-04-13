export type FactionId = 'northland-tribe';
export type UnitRole = 'frontline' | 'ranged' | 'support' | 'skirmisher';
export type TotemStat = 'attack' | 'health' | 'tempo';
export type RewardKind = 'unit' | 'totem' | 'economy';

export interface ChapterDefinition {
  id: string;
  title: string;
  faction: FactionId;
  summary: string;
  backdrop: string;
}

export interface UnitDefinition {
  id: string;
  name: string;
  role: UnitRole;
  tribe: FactionId;
  tier: 1 | 2 | 3;
  attack: number;
  health: number;
  attackIntervalMs: number;
  range: number;
  skillName: string;
  skillText: string;
}

export interface TotemDefinition {
  id: string;
  name: string;
  description: string;
  stat: TotemStat;
  modifier: number;
}

export interface WaveEnemy {
  id: string;
  name: string;
  attack: number;
  health: number;
}

export interface WaveDefinition {
  id: string;
  title: string;
  powerScore: number;
  enemies: WaveEnemy[];
}

export interface BenchUnit {
  instanceId: string;
  unitId: string;
  star: 1 | 2 | 3;
}

export interface RewardChoice {
  kind: RewardKind;
  id: string;
  label: string;
  description: string;
}

export interface BattleSimulationInput {
  alliedUnits: BenchUnit[];
  enemyWaveId: string;
  ownedTotemIds: string[];
}

export interface BattleSimulationResult {
  outcome: 'victory' | 'defeat';
  remainingHealth: number;
  damageLog: string[];
  waveLabel: string;
}

export interface RunState {
  health: number;
  gold: number;
  population: number;
  usedPopulation: number;
  waveNumber: number;
  bench: BenchUnit[];
  unlockedUnitIds: string[];
  ownedTotemIds: string[];
}
