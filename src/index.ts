import creatureTypes from './data/creature-tokens.json' with { type: 'json' };
import wordTokens from './data/word-tokens.json' with { type: 'json' };
import colorTokens from './data/color-tokens.json' with { type: 'json' };

function toCreatureType(emoji: string): string | undefined {
  if (emoji in creatureTypes) {
    return creatureTypes[emoji as keyof typeof creatureTypes];
  }
}

function toColor(emoji: string): string | undefined {
  if (emoji in colorTokens) {
    return colorTokens[emoji as keyof typeof colorTokens];
  }
}

function toOracleWord(emoji: string): string | undefined {
  if (emoji in wordTokens) {
    return wordTokens[emoji as keyof typeof wordTokens];
  }
}

function toYear(n: number) {
  if (n < 90) {
    return 2000 + n;
  }

  return 1900 + n;
}

const TokenType = {
  TEXT: 1,
  EMOJI: 2,
  DATE_RANGE__FROM: 3,
  DATE_RANGE__TO: 4,
  DATE_RANGE__BETWEEN: 5,
  OPERATOR__NEGATE: 6,
  OPERATOR__CONJOIN: 7,
  OPERATOR__DISJOIN: 8,
  OPERATOR__CONJOIN_NEGATIONS: 9,
  OPERATOR__ART_TAG: 10,
  OPERATOR__ARTIST: 11,
  OPERATOR__ORACLE_TEXT: 12,
} as const;

type TokenType = (typeof TokenType)[keyof typeof TokenType];

type Token =
  | {
      type: typeof TokenType.DATE_RANGE__BETWEEN;
      start: number;
      end: number;
    }
  | {
      type: typeof TokenType.DATE_RANGE__FROM;
      start: number;
    }
  | {
      type: typeof TokenType.DATE_RANGE__TO;
      end: number;
    }
  | {
      type:
        | typeof TokenType.OPERATOR__CONJOIN_NEGATIONS
        | typeof TokenType.OPERATOR__CONJOIN
        | typeof TokenType.OPERATOR__DISJOIN
        | typeof TokenType.OPERATOR__NEGATE
        | typeof TokenType.OPERATOR__ART_TAG
        | typeof TokenType.OPERATOR__ARTIST
        | typeof TokenType.OPERATOR__ORACLE_TEXT;
    }
  | {
      type: typeof TokenType.EMOJI | typeof TokenType.TEXT;
      value: string;
    };

function isWhitespace(ch: string) {
  return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
}

function tokenize(source: string): Array<Token> {
  const tokens = [] as Array<Token>;
  const segments = [
    ...new Intl.Segmenter('en', {
      granularity: 'grapheme',
    }).segment(source),
  ].map((_) => _.segment);

  for (let i = 0; i < segments.length; ) {
    let text = '';
    // skip whitespace
    while (i < segments.length && isWhitespace(segments[i]!)) {
      i++;
    }

    // match single character operators
    if (segments[i] === '.') {
      tokens.push({ type: TokenType.OPERATOR__CONJOIN });
      i++;
      continue;
    }

    if (segments[i] === '!') {
      tokens.push({ type: TokenType.OPERATOR__NEGATE });
      i++;
      continue;
    }

    if (segments[i] === '^') {
      tokens.push({ type: TokenType.OPERATOR__CONJOIN_NEGATIONS });
      i++;
      continue;
    }

    if (segments[i] === '|') {
      tokens.push({ type: TokenType.OPERATOR__DISJOIN });
      i++;
      continue;
    }

    // read a single text token
    while (
      i < segments.length &&
      !isWhitespace(segments[i]!) &&
      !isEmoji(segments[i]!)
    ) {
      // otherwise continue absorbing this token
      text += segments[i]!;
      i++;
    }

    if (text.length) {
      let match;
      // match NN-NN
      if (text.length === 5 && (match = /^(\d\d)-(\d\d)/.exec(text))) {
        const start = toYear(parseInt(match[1] ?? '', 10));
        const end = toYear(parseInt(match[2] ?? '', 10));
        tokens.push({ type: TokenType.DATE_RANGE__BETWEEN, start, end });
      } else if (text.length === 3 && (match = /^(\d\d)-/.exec(text))) {
        const start = toYear(parseInt(match[1] ?? '', 10));
        tokens.push({ type: TokenType.DATE_RANGE__FROM, start });
      } else if (text.length === 3 && (match = /^-(\d\d)/.exec(text))) {
        const end = toYear(parseInt(match[1] ?? '', 10));
        tokens.push({ type: TokenType.DATE_RANGE__TO, end });
      } else {
        tokens.push({ type: TokenType.TEXT, value: text });
      }
    }

    // skip whitespace
    while (i < segments.length && isWhitespace(segments[i]!)) {
      i++;
    }

    // read any number of emoji
    while (i < segments.length && isEmoji(segments[i]!)) {
      if (segments[i] === '👎') {
        tokens.push({ type: TokenType.OPERATOR__CONJOIN_NEGATIONS });
        i++;
        continue;
      }

      if (segments[i] === '🖼️') {
        tokens.push({ type: TokenType.OPERATOR__ART_TAG });
        i++;
        continue;
      }

      if (segments[i] === '👨‍🎨') {
        tokens.push({ type: TokenType.OPERATOR__ARTIST });
        i++;
        continue;
      }

      if (segments[i] === '🔮') {
        tokens.push({ type: TokenType.OPERATOR__ORACLE_TEXT });
        i++;
        continue;
      }

      tokens.push({ type: TokenType.EMOJI, value: segments[i]! });
      i++;
    }
  }

  return tokens;
}
const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;
function isEmoji(grapheme: string) {
  // \p{Extended_Pictographic} captures standard emojis,
  // complex emoji sequences (like families/flags), and objects.
  return emojiRegex.test(grapheme);
}

const StackValueType = {
  TEXT: 'text',
  CONJUNCTION: 'conjunction',
  DISJUNCTION: 'disjunction',
  NEGATION: 'negation',
  DATE_RANGE: 'date-range',
  TAGGED: 'tagged',
} as const;

type StackValueType = (typeof StackValueType)[keyof typeof StackValueType];

type StackValue =
  | { type: typeof StackValueType.TEXT; value: string }
  | { type: typeof StackValueType.CONJUNCTION; value: StackValue[] }
  | { type: typeof StackValueType.DISJUNCTION; value: StackValue[] }
  | { type: typeof StackValueType.NEGATION; value: StackValue }
  | { type: typeof StackValueType.DATE_RANGE; value: string }
  | { type: typeof StackValueType.TAGGED; tag: string; value: StackValue };

function text(value: string): StackValue {
  return { type: StackValueType.TEXT, value };
}

function conjunction(value: StackValue[]): StackValue {
  return { type: StackValueType.CONJUNCTION, value };
}

function disjunction(value: StackValue[]): StackValue {
  return { type: StackValueType.DISJUNCTION, value };
}

function negation(value: StackValue): StackValue {
  return { type: StackValueType.NEGATION, value };
}

function dateRange(value: string): StackValue {
  return { type: StackValueType.DATE_RANGE, value };
}

function tagged(tag: string, value: StackValue): StackValue {
  return { type: StackValueType.TAGGED, tag, value };
}

function tagWith(v: StackValue, tag: string): StackValue {
  if (v.type === StackValueType.TAGGED) {
    if (v.tag === 'type' || v.tag === 'color') {
      // we just erase 'type' and 'color'
      return tagged(tag, v.value);
    }

    return conjunction([tagged(tag, text(v.tag)), tagged(tag, v.value)]);
  }

  if (v.type === StackValueType.NEGATION) {
    return negation(tagWith(v.value, tag));
  }

  if (v.type === StackValueType.CONJUNCTION) {
    return conjunction(v.value.map((_) => tagWith(_, tag)));
  }

  if (v.type === StackValueType.DISJUNCTION) {
    return disjunction(v.value.map((_) => tagWith(_, tag)));
  }

  if (v.type === StackValueType.DATE_RANGE) {
    // we can't tag a date range so we just drop the tag silently
    return v;
  }

  return tagged(tag, v);
}

export function compile(input: string) {
  const tokens = tokenize(input);
  const stack = [] as Array<StackValue>;
  for (const token of tokens) {
    switch (token.type) {
      case TokenType.OPERATOR__NEGATE: {
        if (stack.length == 0) {
          break;
        }

        let top = stack.pop()!;
        stack.push(negation(top));
        break;
      }

      case TokenType.OPERATOR__CONJOIN: {
        if (stack.length === 0) {
          break;
        }

        let inner = stack.slice();
        stack.splice(0, stack.length);
        stack.push(conjunction(inner));
        break;
      }

      case TokenType.OPERATOR__DISJOIN: {
        if (stack.length === 0) {
          break;
        }

        let inner = stack.slice();
        stack.splice(0, stack.length);
        stack.push(disjunction(inner));
        break;
      }

      case TokenType.OPERATOR__CONJOIN_NEGATIONS: {
        if (stack.length === 0) {
          break;
        }

        let inner = stack.slice();
        stack.splice(0, stack.length);
        stack.push(negation(disjunction(inner)));
        break;
      }

      case TokenType.OPERATOR__ART_TAG: {
        if (stack.length === 0) {
          stack.push(text('art'));
          break;
        }

        let result = tagWith(stack.pop()!, 'art');
        stack.push(result);
        break;
      }

      case TokenType.OPERATOR__ARTIST: {
        if (stack.length === 0) {
          stack.push(text('artist'));
          break;
        }

        let result = tagWith(stack.pop()!, 'artist');
        stack.push(result);
        break;
      }

      case TokenType.OPERATOR__ORACLE_TEXT: {
        if (stack.length === 0) {
          stack.push(text('oracle'));
          break;
        }

        let result = tagWith(stack.pop()!, 'oracle');
        stack.push(result);
        break;
      }

      case TokenType.TEXT: {
        stack.push(text(token.value));
        break;
      }

      case TokenType.DATE_RANGE__TO: {
        stack.push(dateRange(`year<=${token.end}`));
        break;
      }

      case TokenType.DATE_RANGE__FROM: {
        stack.push(dateRange(`year>=${token.start}`));
        break;
      }

      case TokenType.DATE_RANGE__BETWEEN: {
        stack.push(dateRange(`(year>=${token.start} year<=${token.end})`));
        break;
      }

      case TokenType.EMOJI: {
        let found;
        if ((found = toCreatureType(token.value))) {
          stack.push(tagged('type', text(found)));
          break;
        }

        if ((found = toColor(token.value))) {
          stack.push(tagged('color', text(found)));
          break;
        }

        if ((found = toOracleWord(token.value))) {
          stack.push(tagged('oracle', text(found)));
        }
        break;
      }
    }
  }
  return stringify(stack);
}

function stringify(stack: Array<StackValue>): string {
  return stack.map(stringifyValue).join(' ');
}

function stringifyValue(item: StackValue): string {
  switch (item.type) {
    case StackValueType.TEXT:
      return item.value;

    case StackValueType.CONJUNCTION:
      return `(${item.value.map(stringifyValue).toReversed().join(' ')})`;

    case StackValueType.DISJUNCTION:
      return `(${item.value.map(stringifyValue).toReversed().join(' OR ')})`;

    case StackValueType.TAGGED:
      if (item.tag === 'oracle') {
        return `fo:${stringifyValue(item.value)}`;
      }

      return `${item.tag}:${stringifyValue(item.value)}`;

    case StackValueType.DATE_RANGE:
      return `${item.value}`;

    case StackValueType.NEGATION:
      return `-${stringifyValue(item.value)}`;
  }
}
