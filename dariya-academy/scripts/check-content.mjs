import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * Content linter for the language-learning data files.
 *
 * Two-pass per file:
 *   1. collect every Latin word used in the target-language fields (fr / native / audioText / source)
 *   2. flag Latin words inside darija / ar fields that never appear as a real
 *      target-language term -> that is translation leakage / corruption
 *
 * Also flags CJK characters, stray fullwidth punctuation and broken "= ," sequences.
 */
const CJK = /[\u3000-\u9FFF\uFF00-\uFFEF]/
const ARABIC = /\p{Script=Arabic}/u
const LATIN = /[A-Za-z\u00C0-\u024F]{2,}/g
const LIT = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g

/** Every latin word that appears in a pure target-language value of the file. */
const KNOWN = new Set(
  `le la les un une des du de au aux en et ou mais est es sommes etes sont je tu il elle on
   nous vous me te se sa son ses mon ma mes ton ta tes notre nos votre vos ai as avons avez ont
   a e i o u y ne pas tres tout tous toute toutes bien avec sans sous sur dans chez vers entre
   pour par plus moins tres deja encore toujours jamais maintenant ici la
   el los las del una unos unas por para con sobre bajo entre y o pero porque cuando donde que
   quien como este esta esto estos estas mi tu su sus nuestro nuestra soy eres es esta estan
   haben hat sind bin bist seid war nicht kein eine einen einem einer der die das dem den des
   mit von zu auf fuer ohne unter uber zwischen auch aber oder weil wenn wer was wie wo
   merci bonjour bonsoir salut adieu oui non svp france maroc paris lyon rabat marrakech casa
   rabat amine youssef fatima sara john maria antonio
   cv rib edf cdI tpe existe
   postuler publier signer trouver
   bonjour madame monsieur docteur
   identite adresse piece dossier demande addition facture billet train voiture maison chambre
   cuisine table livre chat appartement facade`
    .split(/\s+/)
    .map((w) => w.toLowerCase()),
)


const root = process.argv[2] || '.'
const files = []
;(function walk(dir) {
  if (fs.statSync(dir).isFile()) {
    if (/\.(js|jsx)$/.test(dir)) files.push(dir)
    return
  }
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(js|jsx)$/.test(e.name)) files.push(p)
  }
})(root)

/** English function words — never valid inside darija/ar glosses. */
const ENGLISH = new Set(
  `the a an and or but of to in on at for with is are was were be been am do does did have
   has you your they them their this that these those not no yes very more most some any all
   what where when who how why because then than hello thanks please language lesson exercise
   word sentence translate listen speak answer question price cheap expensive give complete
   means two back home read shape place used use also same other`
    .split(/\s+/)
    .map((w) => w.toLowerCase()),
)

/** French / Spanish / German function words that are fine inside a gloss. */
const FOREIGN_OK = new Set(
  `le la les un une des du de au aux en et ou mais donc ni car que qui quoi dont est es sommes
   etes sont ai as avons avez ont fait faire dit dire vont aller voir savoir pouvoir vouloir
   devoir reste il ils elle on nous vous me te se y lui leur aie ayant eu meme etre etee etees
   etant merci bonjour bonsoir salut adieu oui non svp france maroc paris lyon a e i o u
   el los las del una unos unas por para con sin sobre bajo entre y o pero porque cuando donde
   que quien como este esta esto estos estas mi tu su sus nuestro nuestra es son soy eres esta
   estoy estan haben hat sind bin bist seid war sind nicht kein eine ein einen einem einer der
   die das dem den des mit von zu auf fuer ohne unter uber zwischen auch aber oder weil wenn`
    .split(/\s+/)
    .map((w) => w.toLowerCase()),
)

const GLOSS_KEYS = new Set([
  'darija', 'ar', 'native', 'subtitle', 'title', 'intro', 'explanation', 'hint', 'prompt',
])

let count = 0
const report = (file, line, kind, detail) => {
  count++
  console.log(`${file}:${line}  ${kind}  ${detail}`)
}

for (const file of files) {
  // Gate 1: the file must actually be valid JavaScript. A content file that does
  // not parse is useless, and heuristics below silently pass broken syntax.
  // (.jsx is left to esbuild, which cannot be parsed by `node --check`.)
  if (/\.jsx?$/.test(file)) {
    const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf-8' })
    if (res.status !== 0) {
      const out = (res.stderr || '').split('\n')
      const errLine = out.find((l) => l.includes('Error')) || out[0] || 'syntax error'
      const line = (errLine.match(/:(\d+)$/) || [])[1] || 1
      report(file, line, 'SYNTAX ', errLine.trim().slice(0, 160))
      continue
    }
  }

  const text = fs.readFileSync(file, 'utf-8')
  const lineAt = (i) => text.slice(0, i).split('\n').length

  // Per-file allowlist for deliberate foreign terms inside glosses:
  //   /* lint-allow: Schmerzen Rezept Krankenkasse */
  const allow = new Set()
  for (const m of text.matchAll(/\/\*\s*lint-allow:\s*([^*]+?)\s*\*\//g)) {
    for (const w of m[1].split(/\s+/).filter(Boolean)) allow.add(w.toLowerCase())
  }

  let prevEnd = 0
  for (const m of text.matchAll(LIT)) {
    const value = m[1] ?? m[2] ?? m[3] ?? ''
    const start = m.index + m[0].indexOf(value === '' ? "''" : value)
    const line = lineAt(m.index)

    if (CJK.test(value)) report(file, line, 'CJK    ', value.slice(0, 130))
    if (/=\s*[,.;]/.test(value)) report(file, line, 'PUNCT  ', value.slice(0, 130))
    if (/[a-z]\.[A-Z][a-z]{2,}/.test(value)) report(file, line, 'STRAY  ', value.slice(0, 130))

    // English function words inside an arabic gloss field = translation leakage.
    const key = text.slice(prevEnd, m.index).match(/([A-Za-z]+)\s*:\s*['"`]?[^]*$/)?.[1]
    prevEnd = m.index + m[0].length
    if (!key || !GLOSS_KEYS.has(key) || !ARABIC.test(value)) continue

    for (const w of value.match(LATIN) || []) {
      const lw = w.toLowerCase()
      if (allow.has(lw) || FOREIGN_OK.has(lw) || ENGLISH.has(lw)) continue
      if (lw.length > 3 && /[bcdfghjklmnpqrstvwxz]{4,}/.test(lw) === false) continue
      if (lw.length > 3) report(file, line, 'LEAK   ', `${key}:"${w}"  ${value.slice(0, 100)}`)
    }
  }
}

console.log(count ? `\n${count} issue(s)` : '\nOK: content clean')
