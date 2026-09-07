import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');

const FILE_NAME_PATTERN = /^statistics_(\d{4}-\d{2}-\d{2})\.json$/;

const entries = await readdir(DATA_DIR);

const dates = entries
  .map((entry) => FILE_NAME_PATTERN.exec(entry)?.[1])
  .filter((date) => date !== undefined)
  .sort()
  .reverse();

await writeFile(join(DATA_DIR, 'index.json'), `${JSON.stringify({ dates })}\n`);

console.log(`data index: ${dates.length} date(s)`);
