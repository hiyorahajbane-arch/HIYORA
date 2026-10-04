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

function normLang(l) {
  return String(l || '').toLowerCase().replace('_', '-')
}

function pickVoice(lang) {
  if (!speechSupported) return null
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null
  const want = normLang(lang)
  const base = want.split('-')[0]
  // 1. exact match (ar-MA)
  let v = voices.find((x) => normLang(x.lang) === want)
  if (v) return v
  // 2. same base language: prefer Google / natural voices (best quality for Arabic)
  const sameBase = voices.filter((x) => normLang(x.lang).split('-')[0] === base)
  if (sameBase.length) {
    v =
      sameBase.find((x) => /google/i.test(x.name) && normLang(x.lang).startsWith(base)) ||
      sameBase.find((x) => /natural|neural|мая|microsoft.*natural/i.test(x.name)) ||
      sameBase.find((x) => !x.localService) ||
      sameBase[0]
    return v
  }
  return null
}

let voicesReady = null
function whenVoicesReady() {
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      if (!speechSupported) return resolve([])
      const done = () => resolve(speechSynthesis.getVoices())
      try {
        if (speechSynthesis.getVoices().length) done()
        else speechSynthesis.addEventListener('voiceschanged', done, { once: true })
      } catch {
        done()
      }
      // Some browsers never fire the event; do not block the button forever.
      setTimeout(done, 1200)
    })
  }
  return voicesReady
}

// Warm up voices on first user gesture (Chrome loads them lazily).
if (typeof window !== 'undefined') {
  const warm = () => {
    try {
      if ('speechSynthesis' in window) speechSynthesis.getVoices()
    } catch {}
  }
  window.addEventListener('pointerdown', warm, { once: true })
}

function cleanText(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/[*_#`•]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split long text so Chrome doesn't cut it after ~15s. */
function chunkText(text, max = 180) {
  if (text.length <= max) return [text]
  const parts = []
  const sentences = text.split(/(?<=[.!?؟،:;])\s+|\n+/)
  let cur = ''
  for (const s of sentences) {
    if ((cur + ' ' + s).trim().length <= max) {
      cur = (cur + ' ' + s).trim()
    } else {
      if (cur) parts.push(cur)
      if (s.length <= max) cur = s
      else {
        // hard cut long sentence on words
        const words = s.split(' ')
        cur = ''
        for (const w of words) {
          if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim()
          else {
            if (cur) parts.push(cur)
            cur = w
          }
        }
      }
    }
  }
  if (cur) parts.push(cur)
  return parts.length ? parts : [text]
}

function speakOne(part, lang, rate) {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearInterval(keepAlive)
      clearTimeout(safety)
      resolve()
    }
    const u = new SpeechSynthesisUtterance(part)
    u.lang = lang
    u.rate = rate
    u.pitch = 1
    try {
      const voice = pickVoice(lang)
      if (voice) {
        u.voice = voice
        u.lang = voice.lang
      }
    } catch {}
    u.onend = finish
    u.onerror = finish
    // Chrome bug: long utterances go to "paused" and never resume.
    const keepAlive = setInterval(() => {
      try {
        if (speechSynthesis.speaking && speechSynthesis.paused) speechSynthesis.resume()
      } catch {}
    }, 250)
    const safety = setTimeout(finish, 15000 + part.length * 80)
    try {
      speechSynthesis.speak(u)
    } catch {
      finish()
    }
  })
}

export async function speak(text, lang, { rate = 0.95 } = {}) {
  if (!speechSupported || !text) return false
  const clean = cleanText(text)
  if (!clean) return false
  try {
    // Stop previous speech. Chrome cancels a new utterance if speak()
    // follows cancel() in the same task, so wait a tick.
    try {
      speechSynthesis.cancel()
    } catch {}
    await new Promise((r) => setTimeout(r, 60))
    try {
      if (speechSynthesis.paused) speechSynthesis.resume()
    } catch {}
    await whenVoicesReady()
    const chunks = chunkText(clean)
    for (const part of chunks) {
      await speakOne(part, lang || 'ar-MA', rate)
    }
    return true
  } catch {
    return false
  }
}

export function stopSpeaking() {
  if (speechSupported) {
    try {
      speechSynthesis.cancel()
    } catch {}
  }
}

export function speaking() {
  try {
    return speechSupported && speechSynthesis.speaking
  } catch {
    return false
  }
}

function mapRecError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'الميكرو محبوس. حْل القفل 🔒 حد شريط العنوان وعطي الإذن للميكروفون.'
    case 'no-speech':
      return 'ما سمعنا والو. قرّب للميكرو وهضر بصوت عالي.'
    case 'aborted':
      return 'توقف التسجيل. عاود حاول.'
    case 'network':
      return 'مشكل فالأنترنت. التسجيل الصوتي محتاج connexion.'
    case 'language-not-supported':
      return 'هاد اللغة ما مدعوماش للتسجيل فهاد المتصفح. جرّب Chrome.'
    default:
      return 'خطأ فـ التعرف على الصوت. عاود حاول.'
  }
}

/**
 * One-shot dictation.
 * @returns {{promise: Promise<{transcript: string, confidence: number}>, abort: () => void}}
 */
export function dictate(lang, { timeout = 12000 } = {}) {
  if (!Recognition) {
    return { promise: Promise.reject(new Error('التسجيل الصوتي ماشي مدعوم فهاد المتصفح. جرّب Chrome.')), abort: () => {} }
  }
  // SpeechRecognition needs HTTPS or localhost + microphone permission.
  const rec = new Recognition()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.continuous = false

  let settled = false
  let timer = null
  const promise = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (settled) return
      try {
        rec.stop()
      } catch {}
      // onend below will reject with a friendly message
    }, timeout)
    rec.onresult = (e) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        const r = e.results[0]
        const transcript = (r[0].transcript || '').trim()
        if (transcript) resolve({ transcript, confidence: r[0].confidence || 0 })
        else reject(new Error('ما سمعنا والو. عاود بصوت أوضح.'))
      } catch {
        reject(new Error('ما تفهمناش الصوت. عاود حاول.'))
      }
    }
    rec.onerror = (e) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error(mapRecError(e.error)))
    }
    rec.onend = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error('ما تسجل والو. ورّك على الزر وهضر.'))
    }
  })

  try {
    rec.start()
  } catch (err) {
    clearTimeout(timer)
    return { promise: Promise.reject(err), abort: () => {} }
  }
  return { promise, abort: () => { try { rec.stop() } catch {} } }
}
