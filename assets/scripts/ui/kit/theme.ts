/**
 * 水墨国风主题：纯数据，不依赖 cc，可在 node 测试里直接用。
 * 风格基调：宣纸底 + 墨色 + 朱砂点缀。
 */

export const theme = {
  colors: {
    paper: '#f2ecdf', // 宣纸
    paperDark: '#e6ddc8', // 宣纸深
    ink: '#2b2b2f', // 墨色
    inkLight: '#6a6a72', // 淡墨
    cinnabar: '#a83a2a', // 朱砂
    indigo: '#3d4f5f', // 青黛
    gold: '#b8963e', // 鎏金
    hpBack: '#d8cfbb', // 血条底
    damage: '#8c2f22' // 伤害红
  },
  fontSize: {
    title: 56,
    heading: 36,
    body: 28,
    small: 22
  },
  /** 间距阶梯，全部是 4 的倍数 */
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32
  }
} as const;

/** 设计分辨率（竖屏） */
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** 解析 '#rrggbb' 为 0-255 的 rgb 分量；非法输入抛错。 */
export function hexToRgb(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '');

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}
