import type { BattleState, BattleStepResult, SkillHit } from './BattleTypes';
import { nearestLivingUnits } from './Targeting';

/** 苍狼祝祷：全队减伤 20%，持续 8 秒。 */
const WOLF_BLESSING_DURATION_MS = 8000;
const WOLF_BLESSING_REDUCTION = 0.2;
/** 虎牙破阵：全体敌人 25 点范围伤害。 */
const TIGER_CHARGE_DAMAGE = 25;
/** 风羽回旋：最多 3 名敌人各 12 点伤害并减速 2 秒。 */
const FEATHER_BOUNCE_DAMAGE = 12;
const FEATHER_BOUNCE_MAX_TARGETS = 3;
const FEATHER_BOUNCE_SLOW_MS = 2000;
const FEATHER_BOUNCE_SLOW_FACTOR = 1.5;

/**
 * 释放主角技能（每场战斗一次，由调用方控制次数）。
 * casterId 用于风羽回旋的"最近"判定；缺省时退化为按数组顺序。
 */
export function applyHeroSkill(skillId: string, state: BattleState, casterId = ''): BattleStepResult {
  const next: BattleState = {
    ...state,
    allies: state.allies.map((unit) => ({ ...unit })),
    enemies: state.enemies.map((unit) => ({ ...unit }))
  };
  const caster = next.allies.find((unit) => unit.id === casterId) ?? null;
  let targetIds: string[] = [];
  let hits: SkillHit[] = [];

  switch (skillId) {
    case 'wolfBlessing': {
      const until = next.elapsedMs + WOLF_BLESSING_DURATION_MS;
      for (const ally of next.allies) {
        if (ally.hp <= 0) continue;
        ally.damageReductionUntilMs = until;
        ally.damageReductionRatio = WOLF_BLESSING_REDUCTION;
        targetIds.push(ally.id);
      }
      break;
    }
    case 'tigerCharge': {
      for (const enemy of next.enemies) {
        if (enemy.hp <= 0) continue;
        enemy.hp -= TIGER_CHARGE_DAMAGE;
        targetIds.push(enemy.id);
        hits.push({ targetId: enemy.id, damage: TIGER_CHARGE_DAMAGE, killed: enemy.hp <= 0 });
      }
      break;
    }
    case 'featherBounce': {
      const referenceSlot = caster?.slot ?? 0;
      const targets = nearestLivingUnits(referenceSlot, next.enemies, FEATHER_BOUNCE_MAX_TARGETS);
      for (const enemy of targets) {
        enemy.hp -= FEATHER_BOUNCE_DAMAGE;
        enemy.slowedUntilMs = next.elapsedMs + FEATHER_BOUNCE_SLOW_MS;
        enemy.slowFactor = FEATHER_BOUNCE_SLOW_FACTOR;
        targetIds.push(enemy.id);
        hits.push({ targetId: enemy.id, damage: FEATHER_BOUNCE_DAMAGE, killed: enemy.hp <= 0 });
      }
      break;
    }
    default:
      return { state, events: [] };
  }

  return {
    state: next,
    events: [{ type: 'skill', skillId, casterId, targetIds, hits }]
  };
}
