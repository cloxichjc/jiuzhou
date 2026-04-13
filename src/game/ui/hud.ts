import Phaser from 'phaser';
import { chapter } from '../data/chapter';
import type { RunState } from '../types';

export interface HudRefs {
  chapterText: Phaser.GameObjects.Text;
  statLine: Phaser.GameObjects.Text;
  progressLine: Phaser.GameObjects.Text;
  loreLine: Phaser.GameObjects.Text;
}

export function createHud(scene: Phaser.Scene, state: RunState): HudRefs {
  const chapterText = scene.add.text(38, 34, chapter.title, {
    color: '#2b1b0f',
    fontFamily: 'Microsoft YaHei',
    fontSize: '28px',
    fontStyle: 'bold',
  });

  const statLine = scene.add.text(38, 76, '', {
    color: '#58432c',
    fontFamily: 'Microsoft YaHei',
    fontSize: '18px',
  });

  const progressLine = scene.add.text(38, 106, '', {
    color: '#7a5933',
    fontFamily: 'Microsoft YaHei',
    fontSize: '16px',
  });

  const loreLine = scene.add.text(248, 38, chapter.summary, {
    color: '#6b4927',
    fontFamily: 'Microsoft YaHei',
    fontSize: '16px',
    align: 'right',
    wordWrap: { width: 102 },
  });

  updateHud({ chapterText, statLine, progressLine, loreLine }, state);
  return { chapterText, statLine, progressLine, loreLine };
}

export function updateHud(hud: HudRefs, state: RunState): void {
  hud.statLine.setText(
    `生命 ${state.health}   金币 ${state.gold}   人口 ${state.usedPopulation}/${state.population}`
  );
  hud.progressLine.setText(
    `第 ${state.waveNumber} 波  ·  图腾 ${state.ownedTotemIds.length}  ·  待命 ${state.bench.length}`
  );
  hud.loreLine.setText(state.ownedTotemIds.length > 0 ? '图腾已醒' : '图腾未醒');
}
