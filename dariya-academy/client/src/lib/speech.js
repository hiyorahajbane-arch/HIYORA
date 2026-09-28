/**
 * Web Speech API wrappers. Everything degrades gracefully: TTS needs
 * speechSynthesis, STT needs SpeechRecognition (Chrome/Edge only), and Darija
 * recognition is weak, so callers must always show a fallback.
 */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

const Recognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export const recognitionSupported = Boolean(Recognition)

/** BCP-47 tag used by the Web Speech API for a course. */
export function speechLang(courseId) {
  switch (courseId) {
    case 'darija':
      return 'ar-MA'
    case 'fr':
      return 'fr-FR'
    case 'en':
      return 'en-US'
    case 'es':
      return 'es-ES'
    case 'de':
      return 'de-DE'
    default:
      return 'ar-MA'
  }
}

function pickVoice(lang) {
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null
  const base = lang.split('-')[0].toLowerCase()
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(base)) ||
    null
  )
}

let voicesReady = null
function whenVoicesReady() {
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const done = () => resolve(speechSynthesis.getVoices())
      if (speechSynthesis.getVoices().length) done()
      else speechSynthesis.addEventListener('voiceschanged', done, { once: true })
      // Some browsers never fire the event; do not block the button forever.
      setTimeout(done, 1200)
    })
  }
  return voicesReady
}

export async function speak(text, lang, { rate = 0.95 } = {}) {
  if (!speechSupported || !text) return false
  stopSpeaking()
  await whenVoicesReady()
  const u = new SpeechSynthesisUtterance(String(text).replace(/\*\*/g, ''))
  u.lang = lang
  u.rate = rate
  u.pitch = 1
  const voice = pickVoice(lang)
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if (speechSupported) speechSynthesis.cancel()
}

export function speaking() {
  return speechSupported && speechSynthesis.speaking
}

/**
 * One-shot dictation.
 * @returns {{promise: Promise<{transcript: string, confidence: number}>, abort: () => void}}
 */
export function dictate(lang) {
  if (!Recognition) {
    return { promise: Promise.reject(new Error('STT غير مدعول فهاد المتصفح')), abort: () => {} }
  }
  const rec = new Recognition()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.continuous = false

  const promise = new Promise((resolve, reject) => {
    rec.onresult = (e) => {
      const r = e.results[0]
      resolve({ transcript: r[0].transcript, confidence: r[0].confidence || 0 })
    }
    rec.onerror = (e) => reject(new Error(e.error || 'خطأ فـ التعرف على الصوت'))
    rec.onend = () => resolve({ transcript: '', confidence: 0 })
  })

  try {
    rec.start()
  } catch (err) {
    return { promise: Promise.reject(err), abort: () => {} }
  }
  return { promise, abort: () => rec.stop() }
}
