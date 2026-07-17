import Phaser from 'phaser';
import { chapter } from '../data/chapter';
import { preloadSharedAssets } from '../ui/assets';
import { drawInkDivider, inkText, makeInkButton, THEME, FONT_SIZE } from '../ui/theme';

/** 标题场景：宣纸远山底 + 题字 + 三主角群像 + 墨色开始按钮。 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload(): void {
    preloadSharedAssets(this);
  }

  create(): void {
    this.add.image(195, 422, 'bg-title').setDisplaySize(390, 844);

    inkText(this, 195, 196, '九州·缥缈录', { size: FONT_SIZE.title, bold: true, color: THEME.inkDeep });
    drawInkDivider(this, 195, 244, 220);
    inkText(this, 195, 276, '一生之盟，自此而始', { size: FONT_SIZE.body, color: THEME.inkLight });

    inkText(this, 195, 330, chapter.title, { size: FONT_SIZE.small, color: THEME.indigo });
    inkText(this, 195, 356, chapter.backdrop, { size: FONT_SIZE.tiny, color: THEME.inkLight });

    // 三主角群像
    const heroes: Array<{ key: string; name: string }> = [
      { key: 'unit-asu', name: '阿苏勒' },
      { key: 'unit-jiye', name: '姬野' },
      { key: 'unit-yuran', name: '羽然' },
    ];
    heroes.forEach((hero, index) => {
      const x = 98 + index * 97;
      this.add.image(x, 512, 'frame-ally').setDisplaySize(96, 96).setAlpha(0.9);
      this.add.image(x, 512, hero.key).setDisplaySize(78, 78);
      inkText(this, x, 574, hero.name, { size: FONT_SIZE.small, bold: true });
    });

    makeInkButton(this, {
      x: 195,
      y: 690,
      width: 200,
      height: 64,
      label: '开始',
      onTap: () => this.scene.start('JiuzhouBattleScene', { freshRun: true }),
    });

    inkText(this, 195, 780, '南淮城里的三个少年，还不知道命运的名字', {
      size: FONT_SIZE.tiny,
      color: THEME.inkLight,
    });

    this.cameras.main.fadeIn(260, 24, 22, 18);
  }
}
