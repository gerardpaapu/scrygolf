#!/usr/bin/env node

import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs';

async function downloadCreatureTypes() {
  const URL = `https://api.scryfall.com/catalog/creature-types`;

  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  await pipeline(
    res.body,
    fs.createWriteStream('./data/creature-types.json', 'utf8'),
  );
}

async function downloadOracleData() {
  const URL =
    'https://data.scryfall.io/oracle-cards/oracle-cards-20260604210341.json';

  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Failed to download oracle data`);
  }

  await pipeline(
    res.body,
    fs.createWriteStream(`./data/oracle-data.json`, 'utf8'),
  );
}

try {
  await fs.mkdir('data', { recursive: true });
  await downloadCreatureTypes();
  await downloadOracleData();
} catch (e) {
  process.stderr.write(`Failed to download scryfall data: ${String(e)}`);
  process.exitCode = 1;
}
