import type { BattleEvent, SkillHit } from '../battle/BattleTypes';
import type { BattleUnitView } from './BattleController';
import { grid, type Rect } from './kit/layout';

/**
 * 战斗页视图模型：把战斗状态与事件映射成"渲染指令"，
 * 纯函数、不依赖 cc，表现层（BattleSceneBinder）只负责执行这些指令。
 */

export type UnitSide = 'ally' | 'enemy';

export interface BoardGeometry {
  /** 左上角格子（slot 0）中心 x */
  originX: number;
  /** 左上角格子（slot 0）中心 y */
  originY: number;
  cellWidth: number;
  cellHeight: number;
  gapX: number;
  gapY: number;
}

/** 720x1280 竖屏布局：敌方棋盘在中上，我方棋盘在中下。 */
export const ENEMY_BOARD: BoardGeometry = { originX: -208, originY: 317, cellWidth: 180, cellHeight: 170, gapX: 28, gapY: 24 };
export const ALLY_BOARD: BoardGeometry = { originX: -208, originY: -83, cellWidth: 180, cellHeight: 170, gapX: 28, gapY: 24 };

/** slot 0-5（行优先）→ 格子矩形。 */
export function slotRect(board: BoardGeometry, slot: number): Rect {
  const rects = grid({
    originX: board.originX,
    originY: board.originY,
    cols: 3,
    rows: 2,
    cellWidth: board.cellWidth,
    cellHeight: board.cellHeight,
    gapX: board.gapX,
    gapY: board.gapY
  });
  return rects[Math.max(0, Math.min(5, slot))];
}

export function heroArtPath(heroId: string): string {
  return `art/portrait_${heroId}`;
}

const enemyArtPaths: Record<string, string> = {
  'bandit-melee': 'art/enemy_melee',
  'bandit-ranged': 'art/enemy_ranged',
  'bandit-shield': 'art/enemy_shield',
  'elite-guard': 'art/enemy_elite',
  captain: 'art/enemy_captain'
};

export function enemyArtPath(unitId: string): string {
  return enemyArtPaths[unitId] ?? 'art/enemy_melee';
}

export function frameArtPath(side: UnitSide): string {
  return side === 'ally' ? 'art/frame_ally' : 'art/frame_enemy';
}

export function unitArtPath(side: UnitSide, unitId: string): string {
  return side === 'ally' ? heroArtPath(unitId) : enemyArtPath(unitId);
}

export interface UnitRenderModel extends BattleUnitView {
  side: UnitSide;
  artPath: string;
  framePath: string;
  rect: Rect;
}

/** 一侧所有单位的渲染模型（含棋盘落位）。 */
export function buildUnitModels(side: UnitSide, views: BattleUnitView[], board: BoardGeometry): UnitRenderModel[] {
  return views.map((view) => ({
    ...view,
    side,
    artPath: unitArtPath(side, view.id),
    framePath: frameArtPath(side),
    rect: slotRect(board, view.slot)
  }));
}

export type BattleEffect =
  | { kind: 'attack'; attackerId: string; attackerSide: UnitSide; targetId: string; damage: number; killed: boolean }
  | { kind: 'skill'; skillId: string; casterId: string; targetIds: string[]; hits: SkillHit[] };

/**
 * 战斗事件 → 表现指令。
 * phaseChanged 不在这里呈现（波次横幅由 binder 监听 waveIndex，胜负由路由切场景）。
 */
export function mapEventsToEffects(events: BattleEvent[], allyIds: string[]): BattleEffect[] {
  const effects: BattleEffect[] = [];

  for (const event of events) {
    if (event.type === 'attack') {
      effects.push({
        kind: 'attack',
        attackerId: event.attackerId,
        attackerSide: allyIds.includes(event.attackerId) ? 'ally' : 'enemy',
        targetId: event.targetId,
        damage: event.damage,
        killed: event.killed
      });
    } else if (event.type === 'skill') {
      effects.push({
        kind: 'skill',
        skillId: event.skillId,
        casterId: event.casterId,
        targetIds: event.targetIds,
        hits: event.hits
      });
    }
  }

  return effects;
}
