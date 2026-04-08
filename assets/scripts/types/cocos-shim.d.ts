declare module 'cc' {
  export const _decorator: {
    ccclass(name?: string): ClassDecorator;
    property(target: Object, propertyKey: string): void;
  };

  export class Component {
    onLoad?(): void;
    lateUpdate?(deltaTime: number): void;
    update?(deltaTime: number): void;
  }
}
