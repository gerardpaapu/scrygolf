import { type Token, TokenType } from './token.js';

function toYear(n: number) {
  if (n < 90) {
    return 2000 + n;
  }

  return 1900 + n;
}

function isWhitespace(ch: string) {
  return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
}

export function tokenize(source: string): Array<Token> {
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
