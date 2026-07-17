import { describe, expect, it } from 'vitest';
import { centerIn, grid, hbox, vbox } from '../../assets/scripts/ui/kit/layout';
import { hexToRgb } from '../../assets/scripts/ui/kit/theme';

describe('kit theme', () => {
  it('parses hex colors into rgb channels', () => {
    expect(hexToRgb('#f2ecdf')).toEqual({ r: 242, g: 236, b: 223 });
    expect(hexToRgb('2b2b2f')).toEqual({ r: 43, g: 43, b: 47 });
  });

  it('rejects invalid hex colors', () => {
    expect(() => hexToRgb('#12345')).toThrow('Invalid hex color');
    expect(() => hexToRgb('red')).toThrow('Invalid hex color');
  });
});

describe('kit layout vbox', () => {
  it('stacks items downward with spacing, centered by default', () => {
    const rects = vbox({ x: 100, y: 500, width: 200, itemHeights: [40, 60], spacing: 10 });

    expect(rects).toEqual([
      { x: 100, y: 480, width: 200, height: 40 },
      { x: 100, y: 420, width: 200, height: 60 }
    ]);
  });

  it('aligns items to the left edge', () => {
    const rects = vbox({ x: 0, y: 100, width: 200, itemHeights: [50], spacing: 0, align: 'left' });

    expect(rects[0].x).toBe(100);
  });

  it('aligns items to the right edge', () => {
    const rects = vbox({ x: 200, y: 100, width: 200, itemHeights: [50], spacing: 0, align: 'right' });

    expect(rects[0].x).toBe(100);
  });

  it('handles an empty item list', () => {
    expect(vbox({ x: 0, y: 0, width: 100, itemHeights: [], spacing: 8 })).toEqual([]);
  });
});

describe('kit layout hbox', () => {
  it('lays items out rightward with spacing, centered by default', () => {
    const rects = hbox({ x: 0, y: 50, height: 30, itemWidths: [100, 50], spacing: 10 });

    expect(rects).toEqual([
      { x: 50, y: 50, width: 100, height: 30 },
      { x: 135, y: 50, width: 50, height: 30 }
    ]);
  });

  it('aligns items to the top edge', () => {
    const rects = hbox({ x: 0, y: 100, height: 40, itemWidths: [80], spacing: 0, align: 'top' });

    expect(rects[0].y).toBe(80);
  });

  it('aligns items to the bottom edge', () => {
    const rects = hbox({ x: 0, y: 100, height: 40, itemWidths: [80], spacing: 0, align: 'bottom' });

    expect(rects[0].y).toBe(120);
  });
});

describe('kit layout grid', () => {
  it('returns cols * rows cells in row-major order', () => {
    const rects = grid({ originX: 0, originY: 100, cols: 3, rows: 2, cellWidth: 50, cellHeight: 40, gapX: 10, gapY: 20 });

    expect(rects).toHaveLength(6);
    expect(rects[0]).toEqual({ x: 0, y: 100, width: 50, height: 40 });
    expect(rects[1].x).toBe(60);
    expect(rects[2].x).toBe(120);
    expect(rects[3]).toEqual({ x: 0, y: 40, width: 50, height: 40 });
    expect(rects[5].x).toBe(120);
    expect(rects[5].y).toBe(40);
  });

  it('handles a single cell', () => {
    const rects = grid({ originX: 5, originY: 6, cols: 1, rows: 1, cellWidth: 10, cellHeight: 20, gapX: 0, gapY: 0 });

    expect(rects).toEqual([{ x: 5, y: 6, width: 10, height: 20 }]);
  });
});

describe('kit layout centerIn', () => {
  it('returns the container center regardless of child size', () => {
    expect(centerIn({ x: 10, y: 20, width: 100, height: 100 }, { width: 30, height: 40 })).toEqual({ x: 10, y: 20 });
  });
});
