import Phaser from 'phaser';

export function preloadSharedAssets(scene: Phaser.Scene): void {
  scene.load.image('ground', '/art/frost-ground.svg');
  scene.load.image('board-shangzhou', '/art/board-shangzhou.svg');
  scene.load.image('panel-header', '/art/panel-header.svg');
  scene.load.image('panel-bench', '/art/panel-bench.svg');
  scene.load.image('panel-detail', '/art/panel-detail.svg');
  scene.load.image('panel-reward', '/art/panel-reward.svg');
  scene.load.image('card-unit', '/art/card-unit.svg');
  scene.load.image('card-reward', '/art/card-reward.svg');
  scene.load.image('card-bench-compact', '/art/card-bench-compact.svg');
  scene.load.image('hud-pill', '/art/hud-pill.svg');
  scene.load.image('button-lacquer', '/art/button-lacquer.svg');
  scene.load.image('slot-stone', '/art/slot-stone.svg');
  scene.load.image('unit-axe-warrior', '/art/unit-axe-warrior.svg');
  scene.load.image('unit-frost-shaman', '/art/unit-frost-shaman.svg');
  scene.load.image('unit-wolf-rider', '/art/unit-wolf-rider.svg');
  scene.load.image('unit-wastes-hunter', '/art/unit-wastes-hunter.svg');
  scene.load.image('enemy-melee', '/art/enemy-melee.svg');
  scene.load.image('enemy-projectile', '/art/enemy-projectile.svg');
  scene.load.image('enemy-spell', '/art/enemy-spell.svg');
  scene.load.image('totem-war-drum', '/art/totem-war-drum.svg');
  scene.load.image('totem-wolf-spirit', '/art/totem-wolf-spirit.svg');
  scene.load.image('totem-frost-bone', '/art/totem-frost-bone.svg');
  scene.load.image('title-emblem', '/art/title-emblem.svg');
}
