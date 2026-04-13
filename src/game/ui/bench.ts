import Phaser from 'phaser';
import { getUnitDefinitionOrThrow } from '../core/helpers';
import type { BenchUnit } from '../types';

export interface BenchRenderResult {
  cardObjects: Phaser.GameObjects.Container[];
  panel: Phaser.GameObjects.Container;
}

export function createBenchPanel(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const panel = scene.add.container(18, 650);
  const background = scene.add.rectangle(177, 88, 354, 158, 0xf2e4c9);
  background.setOrigin(0.5);
  background.setStrokeStyle(3, 0x715231);
  const label = scene.add.text(18, 14, '待上场战团', {
    color: '#5a4128',
    fontFamily: 'Microsoft YaHei',
    fontSize: '20px',
  });
  panel.add([background, label]);
  return panel;
}

export function renderBenchUnits(
  scene: Phaser.Scene,
  panel: Phaser.GameObjects.Container,
  bench: BenchUnit[],
  onSelect: (unit: BenchUnit) => void
): BenchRenderResult {
  const cardObjects: Phaser.GameObjects.Container[] = [];
  const xPositions = [18, 102, 186, 270];

  bench.slice(0, 4).forEach((benchUnit, index) => {
    const unit = getUnitDefinitionOrThrow(benchUnit.unitId);
    const card = scene.add.container(xPositions[index], 42);
    const frame = scene.add.rectangle(34, 34, 68, 68, 0xd8bf95);
    frame.setOrigin(0);
    frame.setStrokeStyle(2, 0x6a4c2b);
    const title = scene.add.text(44, 48, unit.name.slice(0, 4), {
      color: '#312010',
      fontFamily: 'Microsoft YaHei',
      fontSize: '15px',
    });
    const star = scene.add.text(44, 90, `${benchUnit.star}星`, {
      color: '#8b5e13',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
    });
    card.add([frame, title, star]);
    frame.setInteractive({ useHandCursor: true }).on('pointerdown', () => onSelect(benchUnit));
    panel.add(card);
    cardObjects.push(card);
  });

  return { cardObjects, panel };
}
