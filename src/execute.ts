import creatureTypes from './data/creature-tokens.json' with { type: 'json' };
import wordTokens from './data/word-tokens.json' with { type: 'json' };
import colorTokens from './data/color-tokens.json' with { type: 'json' };
import type { Token } from './token.js';
import { TokenType } from './token.js';

import {
  conjunction,
  dateRange,
  disjunction,
  negation,
  tagged,
  text,
  type StackItem,
  StackItemType,
} from './stack-item.js';

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

function tagWith(v: StackItem, tag: string): StackItem {
  if (v.type === StackItemType.TAGGED) {
    if (v.tag === 'type' || v.tag === 'color') {
      // we just erase 'type' and 'color'
      return tagged(tag, v.value);
    }

    return conjunction([tagged(tag, text(v.tag)), tagged(tag, v.value)]);
  }

  if (v.type === StackItemType.NEGATION) {
    return negation(tagWith(v.value, tag));
  }

  if (v.type === StackItemType.CONJUNCTION) {
    return conjunction(v.value.map((_) => tagWith(_, tag)));
  }

  if (v.type === StackItemType.DISJUNCTION) {
    return disjunction(v.value.map((_) => tagWith(_, tag)));
  }

  if (v.type === StackItemType.DATE_RANGE) {
    // we can't tag a date range so we just drop the tag silently
    return v;
  }

  return tagged(tag, v);
}

export function execute(tokens: Token[]) {
  const stack = [] as Array<StackItem>;
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
        if (stack.length === 0 || stack[0]?.type === 'date-range') {
          stack.push(text('art'));
          break;
        }

        let result = tagWith(stack.pop()!, 'art');
        stack.push(result);
        break;
      }

      case TokenType.OPERATOR__ARTIST: {
        if (stack.length === 0 || stack[0]?.type === 'date-range') {
          stack.push(text('artist'));
          break;
        }

        let result = tagWith(stack.pop()!, 'artist');
        stack.push(result);
        break;
      }

      case TokenType.OPERATOR__ORACLE_TEXT: {
        if (stack.length === 0 || stack[0]?.type === 'date-range') {
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
          stack.push(text(found));
        }
        break;
      }
    }
  }

  return stack;
}
