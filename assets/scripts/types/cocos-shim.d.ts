declare module 'cc' {
  export const _decorator: {
    ccclass(name?: string): ClassDecorator;
    property(type?: unknown): PropertyDecorator;
  };

  export class Component {
    node: Node;
    onLoad?(): void;
    lateUpdate?(deltaTime: number): void;
    update?(deltaTime: number): void;
  }

  export class Node {
    constructor(name?: string);
    name: string;
    active: boolean;
    parent: Node | null;
    children: Node[];
    addChild(child: Node): void;
    getChildByName(name: string): Node | null;
    getComponent<T>(type: new (...args: never[]) => T): T | null;
    addComponentInstance<T extends object>(component: T): T;
  }

  export class Label {
    string: string;
  }

  export class Button {
    interactable: boolean;
  }

  export const director: {
    loadedScenes: string[];
    loadScene(sceneName: string): void;
    reset(): void;
  };
}
