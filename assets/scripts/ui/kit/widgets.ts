/**
 * UI 节点工厂：依赖 cc 的薄封装，负责把 theme/layout 变成可见节点。
 *
 * 约定：
 * - 所有节点默认 anchor (0.5, 0.5)，位置用 `setPosition(rect.x, rect.y)`。
 * - 图形一律用 Graphics 手绘（水墨风：宣纸底 + 墨描边），不依赖外部贴图；
 *   立绘/背景等程序生成 PNG 通过 `createInkImage` 从 resources/art 加载。
 * - 这层不写单测，靠 `tests/ui/kit.widgets.spec.ts` 冒烟 + 编辑器预览验证。
 */
import { Color, Graphics, Label, Node, Sprite, SpriteFrame, UITransform, resources } from 'cc';
import { hexToRgb, theme } from './theme';
import type { Rect } from './layout';

/** '#rrggbb' → cc.Color（alpha 0-255） */
export function hexColor(hex: string, alpha = 255): Color {
  const { r, g, b } = hexToRgb(hex);
  return new Color(r, g, b, alpha);
}

/** 把 layout 计算出的 Rect 应用到节点（锚点中心坐标系）。 */
export function applyRect(node: Node, rect: Rect): void {
  node.getComponent(UITransform)?.setContentSize(rect.width, rect.height);
  node.setPosition(rect.x, rect.y);
}

function ensureUITransform(node: Node, width: number, height: number): UITransform {
  const ui = node.addComponent(UITransform);
  ui.setContentSize(width, height);
  return ui;
}

export interface LabelOptions {
  fontSize?: number;
  color?: string;
  name?: string;
  lineHeight?: number;
}

export function createLabel(text: string, options: LabelOptions = {}): Node {
  const node = new Node(options.name ?? 'Label');
  node.addComponent(UITransform);
  const label = node.addComponent(Label);
  label.string = text;
  label.fontSize = options.fontSize ?? theme.fontSize.body;
  label.lineHeight = options.lineHeight ?? Math.round(label.fontSize * 1.25);
  label.color = hexColor(options.color ?? theme.colors.ink);
  return node;
}

export interface PanelOptions {
  width: number;
  height: number;
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  name?: string;
}

/** 宣纸色圆角底板 + 可选墨色描边。 */
export function createPanel(options: PanelOptions): Node {
  const { width, height } = options;
  const node = new Node(options.name ?? 'Panel');
  ensureUITransform(node, width, height);
  const g = node.addComponent(Graphics);
  const radius = options.radius ?? theme.spacing.s;

  g.fillColor = hexColor(options.fill ?? theme.colors.paper);
  g.roundRect(-width / 2, -height / 2, width, height, radius);
  g.fill();

  if (options.borderColor) {
    g.strokeColor = hexColor(options.borderColor);
    g.lineWidth = options.borderWidth ?? 2;
    g.roundRect(-width / 2, -height / 2, width, height, radius);
    g.stroke();
  }

  return node;
}

export interface ButtonOptions {
  width: number;
  height: number;
  onTap: () => void;
  name?: string;
  fontSize?: number;
  fill?: string;
  textColor?: string;
}

export interface ButtonHandle {
  node: Node;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
}

/**
 * 墨色按钮：按压缩放反馈，禁用后变淡墨且不再触发。
 * 触摸用 Node touch 事件而非 cc.Button clickEvents——代码构建 UI 下更可靠。
 */
export function createButton(label: string, options: ButtonOptions): ButtonHandle {
  const { width, height } = options;
  const node = new Node(options.name ?? 'Button');
  ensureUITransform(node, width, height);
  const g = node.addComponent(Graphics);
  let enabled = true;

  const draw = (): void => {
    g.clear();
    g.fillColor = hexColor(enabled ? (options.fill ?? theme.colors.ink) : theme.colors.inkLight);
    g.roundRect(-width / 2, -height / 2, width, height, theme.spacing.s);
    g.fill();
  };
  draw();

  const labelNode = createLabel(label, {
    fontSize: options.fontSize ?? theme.fontSize.body,
    color: options.textColor ?? theme.colors.paper,
    name: 'Label'
  });
  node.addChild(labelNode);

  node.on(Node.EventType.TOUCH_START, () => {
    if (enabled) node.setScale(0.96, 0.96);
  });
  node.on(Node.EventType.TOUCH_END, () => {
    node.setScale(1, 1);
    if (enabled) options.onTap();
  });
  node.on(Node.EventType.TOUCH_CANCEL, () => {
    node.setScale(1, 1);
  });

  return {
    node,
    setEnabled(next: boolean): void {
      enabled = next;
      draw();
    },
    isEnabled(): boolean {
      return enabled;
    }
  };
}

export interface HpBarOptions {
  width: number;
  height?: number;
  fill?: string;
  name?: string;
}

export interface HpBarHandle {
  node: Node;
  /** ratio 0-1，自动截断到区间内 */
  setRatio(ratio: number): void;
}

/** 血条：hpBack 底 + 墨/彩色填充条，左侧对齐增长。 */
export function createHpBar(options: HpBarOptions): HpBarHandle {
  const width = options.width;
  const height = options.height ?? 10;
  const node = new Node(options.name ?? 'HpBar');
  ensureUITransform(node, width, height);

  const back = node.addComponent(Graphics);
  back.fillColor = hexColor(theme.colors.hpBack);
  back.roundRect(-width / 2, -height / 2, width, height, height / 2);
  back.fill();

  const fillNode = new Node('Fill');
  fillNode.addComponent(UITransform).setContentSize(width, height);
  fillNode.setPosition(-width / 2, 0);
  const fill = fillNode.addComponent(Graphics);
  node.addChild(fillNode);

  const drawFill = (ratio: number): void => {
    fill.clear();
    const w = Math.max(0, Math.min(1, ratio)) * width;
    if (w <= 0) return;
    fill.fillColor = hexColor(options.fill ?? theme.colors.ink);
    fill.roundRect(0, -height / 2, w, height, height / 2);
    fill.fill();
  };
  drawFill(1);

  return { node, setRatio: drawFill };
}

export interface InkImageOptions {
  width: number;
  height: number;
  name?: string;
  /** 加载失败时的兜底填充色（纸深），设为 null 则不给兜底 */
  fallbackFill?: string | null;
  onLoaded?: (ok: boolean) => void;
}

/**
 * 从 resources/art 加载程序生成 PNG。
 * path 形如 'art/portrait_asu'（不带扩展名）；失败时画一块纸深色兜底，保证 UI 不崩。
 */
export function createInkImage(path: string, options: InkImageOptions): Node {
  const node = new Node(options.name ?? 'Image');
  ensureUITransform(node, options.width, options.height);
  const sprite = node.addComponent(Sprite);

  resources.load(`${path}/spriteFrame`, SpriteFrame, (error, asset) => {
    if (error || !asset) {
      if (options.fallbackFill !== null) {
        const g = node.addComponent(Graphics);
        g.fillColor = hexColor(options.fallbackFill ?? theme.colors.paperDark, 180);
        g.roundRect(-options.width / 2, -options.height / 2, options.width, options.height, theme.spacing.s);
        g.fill();
      }
      options.onLoaded?.(false);
      return;
    }
    sprite.spriteFrame = asset as SpriteFrame;
    options.onLoaded?.(true);
  });

  return node;
}

/** 手绘感墨线分隔符：略带抖动的三段线。 */
export function createInkDivider(width: number, name = 'InkDivider'): Node {
  const node = new Node(name);
  ensureUITransform(node, width, 6);
  const g = node.addComponent(Graphics);
  g.strokeColor = hexColor(theme.colors.inkLight);
  g.lineWidth = 2;
  const half = width / 2;
  g.moveTo(-half, 0);
  g.lineTo(-half / 3, 1.5);
  g.lineTo(half / 3, -1.5);
  g.lineTo(half, 0);
  g.stroke();
  return node;
}

export interface ChipOptions {
  text: string;
  color?: string;
  textColor?: string;
  fontSize?: number;
  name?: string;
}

/** 小墨章标签（阵营/状态用）：描边小胶囊 + 小字。 */
export function createChip(options: ChipOptions): Node {
  const fontSize = options.fontSize ?? theme.fontSize.small;
  const width = Math.max(options.text.length * (fontSize + 2) + theme.spacing.l, 56);
  const height = fontSize + theme.spacing.m;
  const node = new Node(options.name ?? `Chip_${options.text}`);
  ensureUITransform(node, width, height);
  const g = node.addComponent(Graphics);
  const color = options.color ?? theme.colors.indigo;

  g.strokeColor = hexColor(color);
  g.lineWidth = 2;
  g.roundRect(-width / 2, -height / 2, width, height, height / 2);
  g.stroke();

  const label = createLabel(options.text, { fontSize, color: options.textColor ?? color });
  node.addChild(label);
  return node;
}
