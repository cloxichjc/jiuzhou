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

export class Component {
  node!: Node;
  onLoad?(): void;
  update?(_deltaTime: number): void;
  lateUpdate?(_deltaTime: number): void;
}

export class Node {
  name: string;
  active = true;
  parent: Node | null = null;
  children: Node[] = [];
  private readonly components: object[] = [];

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

  addComponentInstance<T extends object>(component: T): T {
    this.components.push(component);
    return component;
  }
}

export class Label {
  string = '';
}

export class Button {
  interactable = true;
}

export const director = {
  loadedScenes: [] as string[],
  loadScene(sceneName: string) {
    this.loadedScenes.push(sceneName);
  },
  reset() {
    this.loadedScenes = [];
  }
};
