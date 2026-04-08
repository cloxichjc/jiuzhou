export const _decorator = {
  ccclass() {
    return function noopDecorator() {
      return undefined;
    };
  },
  property() {
    return undefined;
  }
};

export class Component {
  onLoad?(): void;
  update?(_deltaTime: number): void;
  lateUpdate?(_deltaTime: number): void;
}
