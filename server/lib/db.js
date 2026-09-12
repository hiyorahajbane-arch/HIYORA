import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'db.json');

const DEFAULT_DB = {
  products: [],
  orders: []
};

function load() {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    save(DEFAULT_DB);
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

function save(db) {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function getDb() {
  return load();
}

export function updateDb(mutator) {
  const db = load();
  const result = mutator(db);
  save(db);
  return result === undefined ? db : result;
}

export function resetDb() {
  save(structuredClone(DEFAULT_DB));
  return structuredClone(DEFAULT_DB);
}