import { type StackItem, StackItemType } from './stack-item.js';

export function stringify(stack: Array<StackItem>): string {
  return stack.map(stringifyValue).join(' ');
}

function stringifyValue(item: StackItem): string {
  switch (item.type) {
    case StackItemType.TEXT:
      return item.value;

    case StackItemType.CONJUNCTION:
      return `(${item.value.map(stringifyValue).toReversed().join(' ')})`;

    case StackItemType.DISJUNCTION:
      return `(${item.value.map(stringifyValue).toReversed().join(' OR ')})`;

    case StackItemType.TAGGED:
      if (item.tag === 'oracle') {
        return `fo:${stringifyValue(item.value)}`;
      }

      return `${item.tag}:${stringifyValue(item.value)}`;

    case StackItemType.DATE_RANGE:
      return `${item.value}`;

    case StackItemType.NEGATION:
      return `-${stringifyValue(item.value)}`;
  }
}
