import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs';

const URL =
  'https://data.scryfall.io/oracle-cards/oracle-cards-20260604210341.json';

export default async function downloadOracleData() {
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Failed to download oracle data`);
  }

  await pipeline(
    res.body,
    fs.createWriteStream(`./data/oracle-data.json`, 'utf8'),
  );
}
