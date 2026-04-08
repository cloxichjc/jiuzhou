import type { HeroConfig, StageConfig } from './GameTypes';
import heroesJson from '../../resources/config/heroes.json';
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

export function loadStages(): StageConfig[] {
  return stagesJson as StageConfig[];
}

export function getStageById(stageId: string): StageConfig | undefined {
  return loadStages().find((stage) => stage.id === stageId);
}
