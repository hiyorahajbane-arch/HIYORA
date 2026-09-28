import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')
const LESSONS_FILE = path.join(DATA_DIR, 'lessons.json')

const empty = { users: [], progress: {} }

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), 'utf-8')
  }
}

export function read() {
  ensure()
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
    return { ...empty, ...parsed }
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), 'utf-8')
    return { ...empty }
  }
}

export function write(data) {
  ensure()
  const tmp = `${DB_FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  // rename over an existing file can fail on Windows if the target is locked.
  try {
    fs.renameSync(tmp, DB_FILE)
  } catch {
    fs.rmSync(DB_FILE, { force: true })
    fs.renameSync(tmp, DB_FILE)
  }
  return data
}

export function update(fn) {
  const data = read()
  const result = fn(data)
  write(data)
  return result
}

export { DB_FILE, DATA_DIR, LESSONS_FILE }
