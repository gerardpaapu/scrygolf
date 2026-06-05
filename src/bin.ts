import { compile } from './index.js';
import * as s from 'node:stream/consumers';

const input = await s.text(process.stdin);
const result = compile(input);
process.stdout.write(`${result}\n`);
