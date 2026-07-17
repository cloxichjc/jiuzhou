/**
 * 纯函数布局计算：不依赖 cc，可在 node 测试里直接跑。
 *
 * 坐标系约定（与 Cocos Creator 一致）：
 * - 所有 Rect 的 x/y 表示节点「锚点中心」在父节点坐标系中的位置（默认 anchor 0.5, 0.5）。
 * - x 向右为正，y 向上为正。
 * - 返回的矩形可直接用于 `node.setPosition(rect.x, rect.y)` +
 *   `node.getComponent(UITransform).setContentSize(rect.width, rect.height)`。
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type HAlign = 'left' | 'center' | 'right';
export type VAlign = 'top' | 'center' | 'bottom';

export interface VBoxOptions {
  /** 水平参考点，含义由 align 决定：left→子项左边缘；center（默认）→子项水平中心；right→子项右边缘 */
  x: number;
  /** 第一个子项顶边的 y 坐标，子项依次向下排列（y 递减） */
  y: number;
  /** 每个子项的宽度（子项通宽） */
  width: number;
  itemHeights: number[];
  /** 相邻子项之间的垂直间距 */
  spacing: number;
  align?: HAlign;
}

/** 垂直堆叠布局：从 y 开始向下排列，返回每个子项的锚点中心矩形。 */
export function vbox(options: VBoxOptions): Rect[] {
  const align = options.align ?? 'center';
  let cursorY = options.y;

  return options.itemHeights.map((height) => {
    const centerY = cursorY - height / 2;
    cursorY -= height + options.spacing;

    const centerX =
      align === 'left'
        ? options.x + options.width / 2
        : align === 'right'
          ? options.x - options.width / 2
          : options.x;

    return { x: centerX, y: centerY, width: options.width, height };
  });
}

export interface HBoxOptions {
  /** 第一个子项左边的 x 坐标，子项依次向右排列（x 递增） */
  x: number;
  /** 垂直参考点，含义由 align 决定：top→子项顶边；center（默认）→子项垂直中心；bottom→子项底边 */
  y: number;
  /** 每个子项的高度（子项通高） */
  height: number;
  itemWidths: number[];
  /** 相邻子项之间的水平间距 */
  spacing: number;
  align?: VAlign;
}

/** 水平排列布局：从 x 开始向右排列，返回每个子项的锚点中心矩形。 */
export function hbox(options: HBoxOptions): Rect[] {
  const align = options.align ?? 'center';
  let cursorX = options.x;

  return options.itemWidths.map((width) => {
    const centerX = cursorX + width / 2;
    cursorX += width + options.spacing;

    const centerY =
      align === 'top'
        ? options.y - options.height / 2
        : align === 'bottom'
          ? options.y + options.height / 2
          : options.y;

    return { x: centerX, y: centerY, width, height: options.height };
  });
}

export interface GridOptions {
  /** 左上角格子（第 0 行第 0 列）中心的 x */
  originX: number;
  /** 左上角格子中心的 y，行向下递增（y 递减） */
  originY: number;
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  gapX: number;
  gapY: number;
}

/** 网格布局：按行优先（row * cols + col）返回 cols * rows 个格子矩形。 */
export function grid(options: GridOptions): Rect[] {
  const rects: Rect[] = [];

  for (let row = 0; row < options.rows; row += 1) {
    for (let col = 0; col < options.cols; col += 1) {
      rects.push({
        x: options.originX + col * (options.cellWidth + options.gapX),
        y: options.originY - row * (options.cellHeight + options.gapY),
        width: options.cellWidth,
        height: options.cellHeight
      });
    }
  }

  return rects;
}

/**
 * 返回一个 size 节点在 container 内居中时的锚点中心坐标。
 * 锚点中心约定下，居中位置即容器中心本身，与子节点 size 无关；
 * 保留 size 参数是为了让调用处意图更清晰（“把多大的东西放进去”）。
 */
export function centerIn(container: Rect, size: Size): { x: number; y: number } {
  void size;
  return { x: container.x, y: container.y };
}
