export const StackItemType = {
  TEXT: 'text',
  CONJUNCTION: 'conjunction',
  DISJUNCTION: 'disjunction',
  NEGATION: 'negation',
  DATE_RANGE: 'date-range',
  TAGGED: 'tagged',
} as const;

export type StackItemType = (typeof StackItemType)[keyof typeof StackItemType];

export type StackItem =
  | { type: typeof StackItemType.TEXT; value: string }
  | { type: typeof StackItemType.CONJUNCTION; value: StackItem[] }
  | { type: typeof StackItemType.DISJUNCTION; value: StackItem[] }
  | { type: typeof StackItemType.NEGATION; value: StackItem }
  | { type: typeof StackItemType.DATE_RANGE; value: string }
  | { type: typeof StackItemType.TAGGED; tag: string; value: StackItem };

export function text(value: string): StackItem {
  return { type: StackItemType.TEXT, value };
}

export function conjunction(value: StackItem[]): StackItem {
  return { type: StackItemType.CONJUNCTION, value };
}

export function disjunction(value: StackItem[]): StackItem {
  return { type: StackItemType.DISJUNCTION, value };
}

export function negation(value: StackItem): StackItem {
  return { type: StackItemType.NEGATION, value };
}

export function dateRange(value: string): StackItem {
  return { type: StackItemType.DATE_RANGE, value };
}

export function tagged(tag: string, value: StackItem): StackItem {
  return { type: StackItemType.TAGGED, tag, value };
}
