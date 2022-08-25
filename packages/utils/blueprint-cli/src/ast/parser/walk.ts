import { Node } from './parser';

/**
 * Implements a visitor pattern to walk all the nodes in a node tree depth first.
 */
export function* walk(node: Node): IterableIterator<Node> {
  yield node;
  for (const subnode of node.members || []) {
    yield* walk(subnode);
  }
}
