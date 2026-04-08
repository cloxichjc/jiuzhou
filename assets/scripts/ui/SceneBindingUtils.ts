import { Button, Label, Node } from 'cc';

function getNode(root: Node, path: string): Node {
  const node = path.split('/').reduce<Node | null>((current, segment) => {
    if (!current) {
      return null;
    }

    return current.getChildByName(segment);
  }, root);

  if (!node) {
    throw new Error(`Missing node: ${path}`);
  }

  return node;
}

function getRequiredComponent<T>(node: Node, type: new (...args: never[]) => T, path: string): T {
  const component = node.getComponent(type);

  if (!component) {
    throw new Error(`Missing component on node: ${path}`);
  }

  return component;
}

export function getLabel(root: Node, path: string): Label {
  return getRequiredComponent(getNode(root, path), Label, path);
}

export function getButton(root: Node, path: string): Button {
  return getRequiredComponent(getNode(root, path), Button, path);
}

export function getNodeByPath(root: Node, path: string): Node {
  return getNode(root, path);
}
