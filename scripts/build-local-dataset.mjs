#!/usr/bin/env node

import u from 'unicode-emoji-json/data-by-emoji.json' with { type: 'json' };
import oracle from '../data/oracle-data.json' with { type: 'json' };
import types from '../data/creature-types.json' with { type: 'json' };
import * as fs from 'node:fs/promises';

const words = new Set();

function addWords(text) {
  if (!text) return;
  // Strip reminder text in parentheses, mana symbols like {W}, and punctuation,
  // then split on whitespace
  const cleaned = text
    //.replace(/\([^)]*\)/g, ' ') // remove parenthetical reminder text
    .replace(/\{[^}]*\}/g, ' ') // remove mana/energy symbols
    .replace(/[^a-zA-Z\s'-]/g, ' '); // keep letters, apostrophes, hyphens
  for (const word of cleaned.split(/\s+/)) {
    const w = word.replace(/^['-]+|['-]+$/g, '').toLowerCase();
    if (w.length > 0) words.add(w);
  }
}

for (const card of oracle) {
  if (['expansion', 'core', 'commander'].indexOf(card.set_type) == -1) {
    continue;
  }

  const faces = card.card_faces ?? [card];
  for (const face of faces) {
    addWords(face.name);
    addWords(face.type_line);
    addWords(face.oracle_text);
  }
}

const presets = new Map();
presets.set('⭕', 'circle');
const presetWords = new Set(presets.values());

const emojiToOracle = new Map();
const oracleToEmoji = new Map();

for (const [k, v] of Object.entries(u)) {
  if (presets.has(k)) {
    continue;
  }

  const names = v.name.toLocaleLowerCase();
  for (const o of names.split(' ')) {
    if (!words.has(o) || presetWords.has(o)) {
      continue;
    }

    let emojis = oracleToEmoji.get(o);
    if (emojis == null) {
      emojis = [];
      oracleToEmoji.set(o, emojis);
    }

    emojis.push(k);

    let oracles = emojiToOracle.get(k);
    if (oracles == null) {
      oracles = [];
      emojiToOracle.set(k, oracles);
    }

    oracles.push(o);
  }
}

const step2 = new Map();

// I want to assign each emoji the word that they represent that is least represented
for (const [emoji, words] of emojiToOracle.entries()) {
  let chosen;
  let count = Infinity;
  for (const word of words) {
    let _count = oracleToEmoji.get(word)?.length ?? 0;
    if (_count < count) {
      chosen = word;
      count = _count;
    }
  }

  // so emoji should translate to chosen, if it's the emoji
  // with the shortest name that translates to chosen
  if (!chosen) {
    continue;
  }

  let length = u[emoji].name.length;
  let current = step2.get(chosen);
  if (current == null || u[current].length < length) {
    step2.set(chosen, emoji);
  }
}
const creatureTypes = new Set(types.data.map((_) => _.toLocaleLowerCase()));
const final = new Map();
const creatures = new Map();

// I'm just going to hard code all of the colors
const colors = new Map();
colors.set('⚪', 'white');
colors.set('🔵', 'blue');
colors.set('⚫', 'black');
colors.set('🔴', 'red');
colors.set('🟢', 'green');

for (const [k, v] of step2.entries()) {
  if (creatureTypes.has(k)) {
    creatures.set(v, k);
    continue;
  }

  if (['white', 'blue', 'black', 'red', 'green'].includes(k)) {
    continue;
  }

  final.set(v, k);
}

for (const [k, v] of presets.entries()) {
  final.set(k, v);
}

await fs.writeFile(
  './src/data/creature-tokens.json',
  JSON.stringify(Object.fromEntries(creatures), null, 2),
  'utf8',
);

await fs.writeFile(
  './src/data/color-tokens.json',
  JSON.stringify(Object.fromEntries(colors), null, 2),
  'utf8',
);

await fs.writeFile(
  './src/data/word-tokens.json',
  JSON.stringify(Object.fromEntries(final), null, 2),
  'utf8',
);
