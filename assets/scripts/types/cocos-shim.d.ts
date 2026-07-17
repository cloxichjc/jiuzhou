declare module 'cc' {
  export const _decorator: {
    ccclass(name?: string): ClassDecorator;
    property(type?: unknown): PropertyDecorator;
  };

  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
  }

  export class Color {
    constructor(r?: number, g?: number, b?: number, a?: number);
    r: number;
    g: number;
    b: number;
    a: number;
  }

  export class Component {
    node: Node;
    onLoad?(): void;
    lateUpdate?(deltaTime: number): void;
    update?(deltaTime: number): void;
  }

  export class Node {
    static EventType: {
      TOUCH_START: string;
      TOUCH_END: string;
      TOUCH_CANCEL: string;
    };

    constructor(name?: string);
    name: string;
    active: boolean;
    parent: Node | null;
    children: Node[];
    addChild(child: Node): void;
    getChildByName(name: string): Node | null;
    getComponent<T>(type: new (...args: never[]) => T): T | null;
    addComponent<T extends object>(type: new () => T): T;
    addComponentInstance<T extends object>(component: T): T;
    setPosition(x: number, y: number, z?: number): void;
    getPosition(): Vec3;
    setScale(x: number, y: number, z?: number): void;
    getScale(): Vec3;
    on(event: string, handler: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    destroy(): void;
  }

  export class UITransform {
    node: Node;
    contentSize: { width: number; height: number };
    anchorPoint: { x: number; y: number };
    setContentSize(width: number | { width: number; height: number }, height?: number): void;
    setAnchorPoint(x: number, y: number): void;
  }

  export class Label {
    node: Node;
    string: string;
    fontSize: number;
    lineHeight: number;
    color: Color;
    horizontalAlign: number;
    overflow: number;
  }

  export class Button {
    node: Node;
    interactable: boolean;
  }

  export class Graphics {
    node: Node;
    fillColor: Color;
    strokeColor: Color;
    lineWidth: number;
    clear(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    rect(x: number, y: number, width: number, height: number): void;
    roundRect(x: number, y: number, width: number, height: number, radius: number): void;
    circle(x: number, y: number, radius: number): void;
    fill(): void;
    stroke(): void;
  }

  export class SpriteFrame {}

  export class Sprite {
    node: Node;
    spriteFrame: SpriteFrame | null;
    color: Color;
  }

  export class UIOpacity {
    node: Node;
    opacity: number;
  }

  export const resources: {
    load(
      path: string,
      type: new (...args: never[]) => unknown,
      callback: (error: Error | null, asset: unknown) => void
    ): void;
  };

  export const director: {
    loadedScenes: string[];
    loadScene(sceneName: string): void;
    reset(): void;
  };
}
