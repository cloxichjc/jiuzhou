import type { EnemyConfig, HeroConfig, StageConfig } from './GameTypes';
import heroesJson from '../../resources/config/heroes.json';
import enemiesJson from '../../resources/config/enemies.json';
import stagesJson from '../../resources/config/stages.json';

export function validateHeroes(input: HeroConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.length !== 3) {
    errors.push('MVP requires exactly three heroes.');
  }

  for (const hero of input) {
    if (!hero.id || !hero.name || !hero.skillId) {
      errors.push(`Hero ${hero.id || 'unknown'} is missing required fields.`);
    }
    if (!(hero.hp > 0) || !(hero.attack > 0) || !(hero.attackIntervalMs > 0)) {
      errors.push(`Hero ${hero.id || 'unknown'} has invalid combat stats.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateEnemies(input: EnemyConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const enemy of input) {
    if (!enemy.id || !enemy.name) {
      errors.push(`Enemy ${enemy.id || 'unknown'} is missing required fields.`);
    }
    if (!(enemy.hp > 0) || !(enemy.attack >= 0) || !(enemy.attackIntervalMs > 0)) {
      errors.push(`Enemy ${enemy.id || 'unknown'} has invalid combat stats.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateStages(input: StageConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.length !== 5) {
    errors.push('MVP requires exactly five stages.');
  }

  for (const stage of input) {
    if (!stage.waves.length) {
      errors.push(`Stage ${stage.id} must have at least one enemy wave.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function loadHeroes(): HeroConfig[] {
  return heroesJson as HeroConfig[];
}

export function loadEnemies(): EnemyConfig[] {
  return enemiesJson as EnemyConfig[];
}

export function loadStages(): StageConfig[] {
  return stagesJson as StageConfig[];
}

export function getHeroById(heroId: string): HeroConfig | undefined {
  return loadHeroes().find((hero) => hero.id === heroId);
}

export function getEnemyById(unitId: string): EnemyConfig | undefined {
  return loadEnemies().find((enemy) => enemy.id === unitId);
}

export function getStageById(stageId: string): StageConfig | undefined {
  return loadStages().find((stage) => stage.id === stageId);
}
