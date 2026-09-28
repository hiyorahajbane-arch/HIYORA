export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
}

export function isCorrect(answer, exercise) {
  const expected = [exercise.answer, ...(exercise.accept || [])]
  const norm = normalize(answer)
  if (!norm) return false
  return expected.some((candidate) => {
    const c = normalize(candidate)
    if (!c) return false
    if (c === norm) return true
    // tolerate a single missing/different article at the edge
    if (/\s/.test(c) || /\s/.test(norm)) {
      return c.replace(/\s+/g, ' ') === norm.replace(/\s+/g, ' ')
    }
    return false
  })
}

/**
 * Speech recognition never returns the reference sentence verbatim: accents get
 * dropped, small words vanish. So for `speak` exercises we score how much of
 * the target sentence was actually heard instead of demanding an exact match.
 */
export function speechScore(transcript, exercise) {
  const said = new Set(normalize(transcript).split(/\s+/).filter((w) => w.length > 1))
  if (!said.size) return 0
  const target = normalize(exercise.audioText || exercise.answer || '')
    .split(/\s+/)
    .filter((w) => w.length > 1)
  if (!target.length) return 0
  const hit = target.filter((w) => said.has(w)).length
  return hit / target.length
}

export function isSpokenWell(transcript, exercise) {
  return speechScore(transcript, exercise) >= 0.6
}
