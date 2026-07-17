export const _decorator = {
  ccclass() {
    return function noopDecorator() {
      return undefined;
    };
  },
  property() {
    return function noopDecorator() {
      return undefined;
    };
  }
};

export class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r = 255, g = 255, b = 255, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

export class Component {
  node!: Node;
  onLoad?(): void;
  update?(_deltaTime: number): void;
  lateUpdate?(_deltaTime: number): void;
}

type EventHandler = (...args: unknown[]) => void;

export class Node {
  static EventType = {
    TOUCH_START: 'touch-start',
    TOUCH_END: 'touch-end',
    TOUCH_CANCEL: 'touch-cancel'
  };

  name: string;
  active = true;
  parent: Node | null = null;
  children: Node[] = [];
  private readonly components: object[] = [];
  private readonly handlers = new Map<string, EventHandler[]>();
  private position = new Vec3();
  private scale = new Vec3(1, 1, 1);

  constructor(name = '') {
    this.name = name;
  }

  addChild(child: Node): void {
    child.parent = this;
    this.children.push(child);
  }

  getChildByName(name: string): Node | null {
    return this.children.find((child) => child.name === name) ?? null;
  }

  getComponent<T>(type: new (...args: never[]) => T): T | null {
    return (this.components.find((component) => component instanceof type) as T | undefined) ?? null;
  }

  addComponent<T extends object>(type: new () => T): T {
    const component = new type();
    Object.assign(component, { node: this });
    this.components.push(component);
    return component;
  }

  addComponentInstance<T extends object>(component: T): T {
    this.components.push(component);
    return component;
  }

  setPosition(x: number, y: number, z = 0): void {
    this.position = new Vec3(x, y, z);
  }

  getPosition(): Vec3 {
    return new Vec3(this.position.x, this.position.y, this.position.z);
  }

  setScale(x: number, y: number, z = 1): void {
    this.scale = new Vec3(x, y, z);
  }

  getScale(): Vec3 {
    return new Vec3(this.scale.x, this.scale.y, this.scale.z);
  }

  on(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  emit(event: string, ...args: unknown[]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(...args);
    }
  }

  destroy(): void {
    this.children = [];
    this.handlers.clear();
    if (this.parent) {
      this.parent.children = this.parent.children.filter((child) => child !== this);
      this.parent = null;
    }
  }
}

export class UITransform {
  node!: Node;
  contentSize = { width: 0, height: 0 };
  anchorPoint = { x: 0.5, y: 0.5 };

  setContentSize(width: number | { width: number; height: number }, height?: number): void {
    if (typeof width === 'object') {
      this.contentSize = { width: width.width, height: width.height };
      return;
    }
    this.contentSize = { width, height: height ?? 0 };
  }

  setAnchorPoint(x: number, y: number): void {
    this.anchorPoint = { x, y };
  }
}

export class Label {
  node!: Node;
  string = '';
  fontSize = 28;
  lineHeight = 32;
  color = new Color();
  horizontalAlign = 1;
  overflow = 0;
}

export class Button {
  node!: Node;
  interactable = true;
}

export interface GraphicsOp {
  op: string;
  args: number[];
}

export class Graphics {
  node!: Node;
  fillColor = new Color();
  strokeColor = new Color();
  lineWidth = 1;
  ops: GraphicsOp[] = [];

  private record(op: string, args: number[]): void {
    this.ops.push({ op, args });
  }

  clear(): void {
    this.ops = [];
  }

  moveTo(x: number, y: number): void {
    this.record('moveTo', [x, y]);
  }

  lineTo(x: number, y: number): void {
    this.record('lineTo', [x, y]);
  }

  rect(x: number, y: number, width: number, height: number): void {
    this.record('rect', [x, y, width, height]);
  }

  roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.record('roundRect', [x, y, width, height, radius]);
  }

  circle(x: number, y: number, radius: number): void {
    this.record('circle', [x, y, radius]);
  }

  fill(): void {
    this.record('fill', []);
  }

  stroke(): void {
    this.record('stroke', []);
  }
}

export class SpriteFrame {}

export class Sprite {
  node!: Node;
  spriteFrame: SpriteFrame | null = null;
  color = new Color();
}

export class UIOpacity {
  node!: Node;
  opacity = 255;
}

export const resources = {
  loadCalls: [] as string[],
  load(path: string, _type: unknown, callback: (error: Error | null, asset: unknown) => void): void {
    this.loadCalls.push(path);
    callback(new Error(`mock: asset not available: ${path}`), null);
  },
  reset(): void {
    this.loadCalls = [];
  }
};

export const director = {
  loadedScenes: [] as string[],
  loadScene(sceneName: string) {
    this.loadedScenes.push(sceneName);
  },
  reset() {
    this.loadedScenes = [];
  }
};
