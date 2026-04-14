import Phaser from 'phaser';
import { chapter } from '../data/chapter';
import type { RunState } from '../types';

export interface HudRefs {
  chapterText: Phaser.GameObjects.Text;
  statHealth: Phaser.GameObjects.Text;
  statGold: Phaser.GameObjects.Text;
  statPopulation: Phaser.GameObjects.Text;
  progressLine: Phaser.GameObjects.Text;
  loreLine: Phaser.GameObjects.Text;
  chipWave: Phaser.GameObjects.Text;
  chipTotem: Phaser.GameObjects.Text;
}

export function createHud(scene: Phaser.Scene, state: RunState): HudRefs {
  const chapterText = scene.add.text(38, 34, chapter.title, {
    color: '#2b1b0f',
    fontFamily: 'Microsoft YaHei',
    fontSize: '28px',
    fontStyle: 'bold',
  });

  const statHealth = scene.add.text(48, 78, '', {
    color: '#58432c',
    fontFamily: 'Microsoft YaHei',
    fontSize: '16px',
  });

  const statGold = scene.add.text(150, 78, '', {
    color: '#58432c',
    fontFamily: 'Microsoft YaHei',
    fontSize: '16px',
  });

  const statPopulation = scene.add.text(252, 78, '', {
    color: '#58432c',
    fontFamily: 'Microsoft YaHei',
    fontSize: '16px',
  });

  const progressLine = scene.add.text(38, 110, '', {
    color: '#7a5933',
    fontFamily: 'Microsoft YaHei',
    fontSize: '13px',
    wordWrap: { width: 220 },
  });

  const chipWave = scene.add.text(250, 108, '', {
    color: '#f7ecd6',
    backgroundColor: '#7b5431',
    fontFamily: 'Microsoft YaHei',
    fontSize: '11px',
    padding: { left: 6, right: 6, top: 3, bottom: 3 },
  });

  const chipTotem = scene.add.text(250, 136, '', {
    color: '#f7ecd6',
    backgroundColor: '#556e4b',
    fontFamily: 'Microsoft YaHei',
    fontSize: '11px',
    padding: { left: 6, right: 6, top: 3, bottom: 3 },
  });

  const loreLine = scene.add.text(248, 38, chapter.summary, {
    color: '#6b4927',
    fontFamily: 'Microsoft YaHei',
    fontSize: '14px',
    align: 'right',
    wordWrap: { width: 94 },
  });

  updateHud({ chapterText, statHealth, statGold, statPopulation, progressLine, loreLine, chipWave, chipTotem }, state);
  return { chapterText, statHealth, statGold, statPopulation, progressLine, loreLine, chipWave, chipTotem };
}

export function updateHud(hud: HudRefs, state: RunState): void {
  hud.statHealth.setText(`生命 ${state.health}`);
  hud.statGold.setText(`金币 ${state.gold}`);
  hud.statPopulation.setText(`人口 ${state.usedPopulation}/${state.population}`);
  hud.progressLine.setText(
    `待命 ${state.bench.length}  ·  已部署 ${state.usedPopulation}  ·  准备进入下一轮交锋`
  );
  hud.loreLine.setText(state.ownedTotemIds.length > 0 ? '部族图腾已醒' : '部族图腾未醒');
  hud.chipWave.setText(`第 ${state.waveNumber} 波`);
  hud.chipTotem.setText(`图腾 ${state.ownedTotemIds.length}`);
}
