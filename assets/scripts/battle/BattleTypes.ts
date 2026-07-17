export type BattlePhase = 'ready' | 'running' | 'won' | 'lost';

/**
 * 战场格子：双方各 3 列 x 2 行，slot 0-5。
 * col = slot % 3，row = floor(slot / 3)（0 前排，1 后排）。
 */
export interface BattleUnit {
  id: string;
  hp: number;
  maxHp: number;
  attack: number;
  slot: number;
  /** 攻击间隔（毫秒），受减速影响时按 slowFactor 拉长 */
  attackIntervalMs: number;
  /** 距下次攻击的剩余毫秒数 */
  cooldownMs: number;
  /** 苍狼祝祷：减伤生效截止时间（battle elapsedMs） */
  damageReductionUntilMs?: number;
  /** 减伤比例，如 0.2 表示减免 20% */
  damageReductionRatio?: number;
  /** 风羽回旋：减速生效截止时间 */
  slowedUntilMs?: number;
  /** 减速倍率，如 1.5 表示攻击间隔变为 1.5 倍 */
  slowFactor?: number;
}

/** 创建战斗时允许只给最小字段，缺省值由 createInitialBattleState 补全。 */
export type BattleUnitInput = Pick<BattleUnit, 'id' | 'hp' | 'attack' | 'slot'> &
  Partial<Omit<BattleUnit, 'id' | 'hp' | 'attack' | 'slot'>>;

export interface BattleState {
  phase: BattlePhase;
  elapsedMs: number;
  allies: BattleUnit[];
  enemies: BattleUnit[];
}

export interface BattleSetup {
  allies: BattleUnitInput[];
  enemies: BattleUnitInput[];
}

export interface SkillHit {
  targetId: string;
  damage: number;
  killed: boolean;
}

export type BattleEvent =
  | { type: 'attack'; attackerId: string; targetId: string; damage: number; killed: boolean }
  | { type: 'skill'; skillId: string; casterId: string; targetIds: string[]; hits: SkillHit[] }
  | { type: 'phaseChanged'; phase: BattlePhase };

export interface BattleStepResult {
  state: BattleState;
  events: BattleEvent[];
}
