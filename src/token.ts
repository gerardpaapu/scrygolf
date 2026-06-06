export const TokenType = {
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

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export type Token =
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
