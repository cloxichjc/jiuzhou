import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { JiuzhouBattleScene } from './scenes/JiuzhouBattleScene';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'app',
  width: 390,
  height: 844,
  backgroundColor: '#1a120e',
  scene: [TitleScene, JiuzhouBattleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};
