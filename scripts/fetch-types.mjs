import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs';

const URL = `https://api.scryfall.com/catalog/creature-types`;

export default async function downloadCreatureTypes() {
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  await pipeline(
    res.body,
    fs.createWriteStream('./data/creature-types.json', 'utf8'),
  );
}
