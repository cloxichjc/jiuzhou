export type BattlePhase = 'ready' | 'running' | 'won' | 'lost';

export interface BattleUnit {
  id: string;
  hp: number;
  attack: number;
  slot: number;
  shield?: number;
}

export interface BattleState {
  phase: BattlePhase;
  elapsedMs: number;
  allies: BattleUnit[];
  enemies: BattleUnit[];
}

export interface BattleSetup {
  allies: BattleUnit[];
  enemies: BattleUnit[];
}
