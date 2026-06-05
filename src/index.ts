import creatureTypes from '../data/creature-tokens.json' with { type: 'json' };
import wordTokens from '../data/word-tokens.json' with { type: 'json' };
import colorTokens from '../data/color-tokens.json' with { type: 'json' };
import * as s from 'node:stream/consumers';

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
  OPERATOE__CONJOIN_NEGATIONS: 9,
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
        | typeof TokenType.OPERATOE__CONJOIN_NEGATIONS
        | typeof TokenType.OPERATOR__CONJOIN
        | typeof TokenType.OPERATOR__DISJOIN
        | typeof TokenType.OPERATOR__NEGATE;
    }
  | {
      type: typeof TokenType.EMOJI | typeof TokenType.TEXT;
      value: string;
    };

function isWhitespace(ch: string) {
  return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\h';
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
      tokens.push({ type: TokenType.OPERATOE__CONJOIN_NEGATIONS });
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
      tokens.push({ type: TokenType.EMOJI, value: segments[i]! });
      i++;
    }
  }

  return tokens;
}

function isEmoji(grapheme: string) {
  // \p{Extended_Pictographic} captures standard emojis,
  // complex emoji sequences (like families/flags), and objects.
  const emojiRegex = /^\p{Extended_Pictographic}$/u;
  return emojiRegex.test(grapheme);
}

const input = await s.text(process.stdin);
const tokens = tokenize(input);
const stack = [] as Array<string>;
for (const token of tokens) {
  switch (token.type) {
    case TokenType.OPERATOR__NEGATE: {
      let top = stack.pop();
      stack.push(`-(${top})`);
      break;
    }

    case TokenType.OPERATOR__CONJOIN: {
      let inner = stack.reverse().join(' ');
      stack.splice(0, stack.length);
      stack.push(`(${inner})`);
      break;
    }

    case TokenType.OPERATOR__DISJOIN: {
      let inner = stack.reverse().join(' OR ');
      stack.splice(0, stack.length);
      stack.push(`(${inner})`);
      break;
    }

    case TokenType.OPERATOE__CONJOIN_NEGATIONS: {
      let inner = stack.reverse().join(' OR ');
      stack.splice(0, stack.length);
      stack.push(`-(${inner})`);
      break;
    }

    case TokenType.TEXT: {
      stack.push(token.value);
      break;
    }

    case TokenType.DATE_RANGE__TO: {
      stack.push(`year<=${token.end}`);
      break;
    }

    case TokenType.DATE_RANGE__FROM: {
      stack.push(`year>=${token.start}`);
      break;
    }

    case TokenType.DATE_RANGE__BETWEEN: {
      stack.push(`(year>=${token.start} date<=${token.end})`);
      break;
    }

    case TokenType.EMOJI: {
      let found;
      if ((found = toCreatureType(token.value))) {
        stack.push(`type:${found}`);
        break;
      }

      if ((found = toColor(token.value))) {
        stack.push(`color:${found}`);
        break;
      }

      if ((found = toOracleWord(token.value))) {
        stack.push(found);
      }
      break;
    }
  }
}

console.log(stack.reverse().join(' '));
