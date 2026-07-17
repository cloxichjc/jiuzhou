import Phaser from 'phaser';
import { chapter } from '../data/chapter';
import { waves } from '../data/waves';
import type { RunState } from '../types';
import { drawPanel, inkText, makeChip, THEME, FONT_SIZE } from './theme';

export interface HudRefs {
  waveChip: Phaser.GameObjects.Container;
  waveText: Phaser.GameObjects.Text;
  statHealth: Phaser.GameObjects.Text;
  statGold: Phaser.GameObjects.Text;
  statPopulation: Phaser.GameObjects.Text;
  totemText: Phaser.GameObjects.Text;
}

function statPill(scene: Phaser.Scene, x: number, y: number, width: number): { text: Phaser.GameObjects.Text } {
  drawPanel(scene, { x, y, width, height: 30, fillAlpha: 0.9, radius: 15, borderWidth: 1.5 });
  const text = inkText(scene, x, y, '', { size: FONT_SIZE.small, color: THEME.ink });
  return { text };
}

/** 顶部 HUD：章节题字 + 波次 chip + 生命/金币/人口 pill + 名物计数。 */
export function createHud(scene: Phaser.Scene, state: RunState): HudRefs {
  inkText(scene, 24, 26, chapter.title, { size: FONT_SIZE.body, bold: true }).setOrigin(0, 0.5);

  const waveChip = makeChip(scene, 330, 26, '', THEME.cinnabar, FONT_SIZE.small);
  const waveText = inkText(scene, 330, 26, '', { size: FONT_SIZE.small, color: THEME.cinnabar, bold: true });

  const health = statPill(scene, 70, 64, 108);
  const gold = statPill(scene, 190, 64, 108);
  const population = statPill(scene, 310, 64, 108);

  const totemText = inkText(scene, 24, 96, '', { size: FONT_SIZE.tiny, color: THEME.gold }).setOrigin(0, 0.5);

  const refs: HudRefs = {
    waveChip,
    waveText,
    statHealth: health.text,
    statGold: gold.text,
    statPopulation: population.text,
    totemText,
  };
  updateHud(refs, state);
  return refs;
}

export function updateHud(hud: HudRefs, state: RunState): void {
  hud.statHealth.setText(`生命 ${state.health}`);
  hud.statGold.setText(`金币 ${state.gold}`);
  hud.statPopulation.setText(`人口 ${state.usedPopulation}/${state.population}`);
  hud.waveText.setText(state.waveNumber > waves.length ? '终' : `第 ${state.waveNumber} 波`);
  hud.totemText.setText(state.ownedTotemIds.length > 0 ? `名物 ${state.ownedTotemIds.length} 已醒` : '');
}
