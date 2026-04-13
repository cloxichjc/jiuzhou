import Phaser from 'phaser';
import { chapter } from '../data/chapter';
import type { RunState } from '../types';

export interface HudRefs {
  title: Phaser.GameObjects.Text;
  stats: Phaser.GameObjects.Text;
  progress: Phaser.GameObjects.Text;
}

export function createHud(scene: Phaser.Scene, state: RunState): HudRefs {
  const title = scene.add.text(28, 28, chapter.title, {
    color: '#2d2215',
    fontFamily: 'Microsoft YaHei',
    fontSize: '24px',
    fontStyle: 'bold',
  });

  const stats = scene.add.text(28, 66, '', {
    color: '#4e3822',
    fontFamily: 'Microsoft YaHei',
    fontSize: '18px',
  });

  const progress = scene.add.text(28, 96, '', {
    color: '#6c5135',
    fontFamily: 'Microsoft YaHei',
    fontSize: '16px',
  });

  updateHud({ title, stats, progress }, state);
  return { title, stats, progress };
}

export function updateHud(hud: HudRefs, state: RunState): void {
  hud.stats.setText(
    `生命 ${state.health}   金币 ${state.gold}   人口 ${state.population}`
  );
  hud.progress.setText(
    `第 ${state.waveNumber} 波  ·  已获图腾 ${state.ownedTotemIds.length}  ·  战团 ${state.bench.length}`
  );
}
