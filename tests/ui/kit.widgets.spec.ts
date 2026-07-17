import { describe, expect, it } from 'vitest';
import { Graphics, Label, Node, UITransform, resources } from 'cc';
import {
  applyRect,
  createButton,
  createChip,
  createHpBar,
  createInkDivider,
  createInkImage,
  createLabel,
  createPanel,
  hexColor
} from '../../assets/scripts/ui/kit/widgets';

describe('kit widgets', () => {
  it('creates a label with ink defaults', () => {
    const node = createLabel('九州');

    expect(node.getComponent(Label)?.string).toBe('九州');
    expect(node.getComponent(UITransform)).not.toBeNull();
  });

  it('creates a panel with fill and border drawn', () => {
    const node = createPanel({ width: 200, height: 100, borderColor: '#2b2b2f' });
    const ops = node.getComponent(Graphics)?.ops ?? [];

    expect(ops.some((op) => op.op === 'fill')).toBe(true);
    expect(ops.some((op) => op.op === 'stroke')).toBe(true);
  });

  it('button fires onTap only when enabled and after a press', () => {
    let taps = 0;
    const button = createButton('开始', { width: 200, height: 60, onTap: () => (taps += 1) });

    button.node.emit(Node.EventType.TOUCH_START);
    expect(button.node.getScale().x).toBeLessThan(1);
    button.node.emit(Node.EventType.TOUCH_END);
    expect(taps).toBe(1);
    expect(button.node.getScale().x).toBe(1);

    button.setEnabled(false);
    button.node.emit(Node.EventType.TOUCH_END);
    expect(taps).toBe(1);
  });

  it('hp bar redraws the fill when ratio changes', () => {
    const bar = createHpBar({ width: 120 });
    const fill = bar.node.getChildByName('Fill')?.getComponent(Graphics);

    bar.setRatio(0.5);
    const rect = fill?.ops.find((op) => op.op === 'roundRect');
    expect(rect?.args[2]).toBe(60);

    bar.setRatio(0);
    expect(fill?.ops.some((op) => op.op === 'roundRect')).toBe(false);
  });

  it('ink image falls back to a paper block when the asset is missing', () => {
    const node = createInkImage('art/portrait_asu', { width: 128, height: 128 });

    expect(resources.loadCalls).toContain('art/portrait_asu/spriteFrame');
    expect(node.getComponent(Graphics)).not.toBeNull();
  });

  it('creates dividers and chips without throwing', () => {
    expect(createInkDivider(300).getComponent(Graphics)).not.toBeNull();
    expect(createChip({ text: '北陆' }).getChildByName('Label')?.getComponent(Label)?.string).toBe('北陆');
  });

  it('applyRect writes size and position onto the node', () => {
    const node = createLabel('x');
    applyRect(node, { x: 12, y: 34, width: 100, height: 50 });

    expect(node.getPosition().x).toBe(12);
    expect(node.getPosition().y).toBe(34);
    expect(node.getComponent(UITransform)?.contentSize).toEqual({ width: 100, height: 50 });
  });

  it('hexColor converts to rgba channels', () => {
    const color = hexColor('#a83a2a');

    expect([color.r, color.g, color.b, color.a]).toEqual([168, 58, 42, 255]);
  });
});
