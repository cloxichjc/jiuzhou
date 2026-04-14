import Phaser from 'phaser';
import { chapter } from '../data/chapter';
import { units } from '../data/units';
import { preloadSharedAssets } from '../ui/assets';
import { playUiClick } from '../ui/sfx';

export class TitleScene extends Phaser.Scene {
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('TitleScene');
  }

  preload(): void {
    preloadSharedAssets(this);
  }

  create(): void {
    this.drawBackdrop();
    this.drawHeroArea();
    this.drawButtons();
    this.cameras.main.fadeIn(220, 18, 12, 8);
  }

  private drawBackdrop(): void {
    this.add.image(195, 422, 'ground').setDisplaySize(390, 844);
    this.add.rectangle(195, 422, 390, 844, 0x1a120d, 0.16);
    this.add.image(195, 430, 'board-shangzhou').setDisplaySize(346, 520).setAlpha(0.96);
  }

  private drawHeroArea(): void {
    this.add.image(195, 188, 'title-emblem').setDisplaySize(150, 150);
    this.add.text(72, 294, '九州 · 殇州试炼', {
      color: '#2d1d12',
      fontFamily: 'Microsoft YaHei',
      fontSize: '28px',
      fontStyle: 'bold',
    });
    this.add.text(82, 332, '北陆荒原，部族战棋再启', {
      color: '#6f5234',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
    });
    this.add.text(92, 394, `当前章节：${chapter.title}`, {
      color: '#5e452b',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
      backgroundColor: '#f1e4c8',
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });
    this.add.text(72, 446, chapter.backdrop, {
      color: '#6c4f2d',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 242 },
    });
    this.add.image(116, 538, 'unit-axe-warrior').setDisplaySize(74, 74);
    this.add.image(194, 532, 'unit-frost-shaman').setDisplaySize(70, 70);
    this.add.image(272, 538, 'unit-wolf-rider').setDisplaySize(74, 74);
  }

  private drawButtons(): void {
    this.buildButton(195, 656, 186, 62, '开始试炼', () => this.startTrial());
    this.buildButton(195, 732, 160, 48, '战团图鉴', () => this.showRoster(), 0.92);
    this.add.text(108, 786, '微信小游戏直入结构：打开即玩，停顿最少。', {
      color: '#7d5d39',
      fontFamily: 'Microsoft YaHei',
      fontSize: '12px',
    });
  }

  private buildButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    alpha = 1
  ): void {
    const skin = this.add.image(x, y, 'button-lacquer').setDisplaySize(width, height).setAlpha(alpha);
    const text = this.add.text(x - (label.length > 3 ? 44 : 34), y - 16, label, {
      color: '#fff4e7',
      fontFamily: 'Microsoft YaHei',
      fontSize: label.length > 3 ? '24px' : '28px',
      fontStyle: 'bold',
    });
    skin.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      playUiClick(this);
      onClick();
    });
    text.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      playUiClick(this);
      onClick();
    });
  }

  private startTrial(): void {
    this.scene.start('JiuzhouBattleScene', { freshRun: true });
  }

  private showRoster(): void {
    this.overlay?.destroy(true);
    const overlay = this.add.container(18, 110);
    const shade = this.add.rectangle(177, 214, 354, 428, 0x120d08, 0.34);
    const panel = this.add.image(177, 214, 'panel-detail').setDisplaySize(340, 404);
    const title = this.add.text(118, 26, '战团图鉴', {
      color: '#2d1d12',
      fontFamily: 'Microsoft YaHei',
      fontSize: '26px',
      fontStyle: 'bold',
    });
    overlay.add([shade, panel, title]);

    units.slice(0, 4).forEach((unit, index) => {
      const x = 34 + (index % 2) * 150;
      const y = 86 + Math.floor(index / 2) * 132;
      const card = this.add.image(x + 54, y + 54, 'card-reward').setDisplaySize(112, 164);
      const icon = this.add.image(x + 54, y + 34, `unit-${unit.id}`).setDisplaySize(52, 52);
      const name = this.add.text(x + 18, y + 70, unit.name, {
        color: '#2d2115',
        fontFamily: 'Microsoft YaHei',
        fontSize: '14px',
        fontStyle: 'bold',
      });
      const role = this.add.text(x + 18, y + 92, `${unit.role} · ${unit.skillName}`, {
        color: '#6b4f31',
        fontFamily: 'Microsoft YaHei',
        fontSize: '10px',
        wordWrap: { width: 72 },
      });
      overlay.add([card, icon, name, role]);
    });

    const close = this.add.text(264, 28, '关闭', {
      color: '#915b32',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
    });
    close.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.overlay?.destroy(true);
      this.overlay = undefined;
    });
    overlay.add(close);
    this.overlay = overlay;
  }
}
