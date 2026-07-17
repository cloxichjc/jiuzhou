import Phaser from 'phaser';

/**
 * 预载水墨资源（tools/artgen 程序生成，public/art/*.png）。
 * UI 面板/按钮一律用 Phaser Graphics 手绘（见 ui/theme.ts），不占图片资源。
 */
export function preloadSharedAssets(scene: Phaser.Scene): void {
  scene.load.image('bg-title', '/art/bg_title.png');
  scene.load.image('bg-battle', '/art/bg_battle.png');

  scene.load.image('unit-jiye', '/art/portrait_jiye.png');
  scene.load.image('unit-asu', '/art/portrait_asu.png');
  scene.load.image('unit-yuran', '/art/portrait_yuran.png');
  scene.load.image('unit-xiyan', '/art/portrait_xiyan.png');

  scene.load.image('enemy-melee', '/art/enemy_melee.png');
  scene.load.image('enemy-ranged', '/art/enemy_ranged.png');
  scene.load.image('enemy-shield', '/art/enemy_shield.png');
  scene.load.image('enemy-elite', '/art/enemy_elite.png');
  scene.load.image('enemy-captain', '/art/enemy_captain.png');

  scene.load.image('frame-ally', '/art/frame_ally.png');
  scene.load.image('frame-enemy', '/art/frame_enemy.png');
  scene.load.image('ink-slash', '/art/ink_slash.png');
  scene.load.image('ink-bloom', '/art/ink_bloom.png');
}
