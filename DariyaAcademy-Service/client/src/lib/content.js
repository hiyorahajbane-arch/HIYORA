/**
 * Helpers for picking the right string out of a multilingual content object.
 *
 * Content objects look like:
 *   { darija, ar, fr, en, native }
 * where `native` / `fr` / `es` / `de` is the language actually being taught, and
 * `darija` / `ar` / `en` are the explanations. So:
 *   - target() -> the text to be read/learned in this course
 *   - gloss()  -> the explanation, in the language of the interface
 */

const ORDER = ['darija', 'ar', 'fr', 'en', 'es', 'de', 'native']

/** The text in the language being studied. */
export function target(obj, courseId) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (courseId === 'darija') return obj.darija || obj.ar || ''
  if (courseId === 'fr') return obj.fr || obj.native || obj.en || ''
  if (courseId === 'en') return obj.en || obj.native || obj.fr || ''
  if (courseId === 'es') return obj.es || obj.native || ''
  if (courseId === 'de') return obj.de || obj.native || obj.en || ''
  return obj.native || obj.darija || obj.ar || ''
}

/** The explanation, in the language of the interface. */
export function gloss(obj, ui) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (ui === 'fr') return obj.fr || obj.en || obj.darija || obj.ar || ''
  if (ui === 'ar') return obj.ar || obj.darija || obj.fr || obj.en || ''
  return obj.darija || obj.ar || obj.fr || obj.en || ''
}

/** A section body: keyed by the taught language, falling back to the UI order. */
export function sectionText(body, courseId, ui) {
  if (!body) return ''
  if (typeof body === 'string') return body
  if (courseId === 'darija') {
    if (ui === 'fr') return body.ar || body.darija || ''
    if (ui === 'ar') return body.ar || body.darija || ''
    return body.darija || body.ar || ''
  }
  return body[courseId] || gloss(body, ui) || ORDER.map((k) => body[k]).find(Boolean) || ''
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}
