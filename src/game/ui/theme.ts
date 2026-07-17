import Phaser from 'phaser';

/**
 * 水墨主题：宣纸/墨/朱砂/青黛色板 + 通用 UI 绘制 helper。
 * 全部 UI 组件用 Graphics 手绘，不依赖图片资源（立绘/背景除外）。
 */

export const THEME = {
  paper: 0xf2ecdf,
  paperDark: 0xe6ddc8,
  ink: 0x2b2b2f,
  inkDeep: 0x1e1e22,
  inkLight: 0x6a6a72,
  cinnabar: 0xa83a2a,
  indigo: 0x3d4f5f,
  gold: 0xb8963e,
  hpBack: 0xd8cfbb,
  damage: 0x8c2f22,
} as const;

export const FONT = '"Noto Serif SC", "Songti SC", "STSong", "SimSun", serif';

export const FONT_SIZE = {
  title: 44,
  heading: 26,
  body: 17,
  small: 13,
  tiny: 11,
} as const;

export interface InkTextOptions {
  size?: number;
  color?: number;
  bold?: boolean;
  align?: string;
  wordWrapWidth?: number;
  origin?: number;
  lineSpacing?: number;
}

/** 居中锚点的墨色文字（origin 默认 0.5）。 */
export function inkText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options: InkTextOptions = {}
): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT,
    fontSize: `${options.size ?? FONT_SIZE.body}px`,
    color: Phaser.Display.Color.IntegerToColor(options.color ?? THEME.ink).rgba,
    align: options.align ?? 'center',
  };
  if (options.bold) {
    style.fontStyle = 'bold';
  }
  if (options.wordWrapWidth) {
    style.wordWrap = { width: options.wordWrapWidth, useAdvancedWrap: true };
  }
  if (options.lineSpacing !== undefined) {
    style.lineSpacing = options.lineSpacing;
  }
  const label = scene.add.text(x, y, text, style);
  label.setOrigin(options.origin ?? 0.5);
  return label;
}

export interface PanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: number;
  fillAlpha?: number;
  border?: number;
  borderWidth?: number;
  radius?: number;
}

/** 宣纸圆角底 + 墨边描边。坐标为面板中心。 */
export function drawPanel(scene: Phaser.Scene, options: PanelOptions): Phaser.GameObjects.Graphics {
  const { x, y, width, height } = options;
  const radius = options.radius ?? 10;
  const g = scene.add.graphics();

  g.fillStyle(options.fill ?? THEME.paper, options.fillAlpha ?? 0.94);
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);

  if (options.border !== null) {
    g.lineStyle(options.borderWidth ?? 2, options.border ?? THEME.ink, 0.85);
    g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  }

  return g;
}

export interface InkButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onTap: () => void;
  fill?: number;
  textColor?: number;
  fontSize?: number;
  radius?: number;
}

/** 墨色按钮：按压缩放反馈，返回 Container。 */
export function makeInkButton(scene: Phaser.Scene, options: InkButtonOptions): Phaser.GameObjects.Container {
  const { x, y, width, height } = options;
  const container = scene.add.container(x, y);

  const g = scene.add.graphics();
  g.fillStyle(options.fill ?? THEME.ink, 1);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, options.radius ?? 10);

  const label = inkText(scene, 0, 0, options.label, {
    size: options.fontSize ?? FONT_SIZE.body + 2,
    color: options.textColor ?? THEME.paper,
    bold: true,
  });

  container.add([g, label]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerdown', () => container.setScale(0.96));
  container.on('pointerup', () => {
    container.setScale(1);
    options.onTap();
  });
  container.on('pointerout', () => container.setScale(1));

  return container;
}

export interface HpBarHandle {
  container: Phaser.GameObjects.Container;
  setRatio(ratio: number): void;
}

/** 血条：hpBack 底 + 前景填充条，左侧对齐。 */
export function makeHpBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  fillColor = THEME.indigo,
  height = 6
): HpBarHandle {
  const container = scene.add.container(x, y);

  const back = scene.add.graphics();
  back.fillStyle(THEME.hpBack, 0.95);
  back.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);

  const fill = scene.add.graphics();
  container.add([back, fill]);

  const setRatio = (ratio: number): void => {
    const clamped = Math.max(0, Math.min(1, ratio));
    fill.clear();
    if (clamped <= 0) {
      return;
    }
    fill.fillStyle(fillColor, 1);
    fill.fillRoundedRect(-width / 2, -height / 2, width * clamped, height, height / 2);
  };
  setRatio(1);

  return { container, setRatio };
}

/** 小墨章（描边胶囊 + 小字）。 */
export function makeChip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color = THEME.indigo,
  fontSize = FONT_SIZE.tiny
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const width = Math.max(text.length * (fontSize + 2) + 14, 44);
  const height = fontSize + 12;

  const g = scene.add.graphics();
  g.lineStyle(1.5, color, 0.9);
  g.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);

  const label = inkText(scene, 0, 0, text, { size: fontSize, color });
  container.add([g, label]);

  return container;
}

/** 手绘感墨线（略带抖动的三段折线）。 */
export function drawInkDivider(scene: Phaser.Scene, x: number, y: number, width: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(2, THEME.inkLight, 0.7);
  const half = width / 2;
  g.beginPath();
  g.moveTo(x - half, y);
  g.lineTo(x - half / 3, y + 1.5);
  g.lineTo(x + half / 3, y - 1.5);
  g.lineTo(x + half, y);
  g.strokePath();
  return g;
}
