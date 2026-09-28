import { useState } from 'react'
import { speak, speechSupported, stopSpeaking } from '../lib/speech.js'

/** 🔊 button that reads any string aloud in the right voice. */
export default function SpeakButton({ text, lang, label, className = '', size = 'md' }) {
  const [playing, setPlaying] = useState(false)

  if (!speechSupported || !text) return null

  const onClick = () => {
    if (playing) {
      stopSpeaking()
      setPlaying(false)
      return
    }
    setPlaying(true)
    speak(text, lang).then((ok) => {
      if (!ok) setPlaying(false)
    })
    // `playing` is a visual hint only; clear it when speech ends.
    const done = () => setPlaying(false)
    window.speechSynthesis.addEventListener('end', done, { once: true })
    window.speechSynthesis.addEventListener('error', done, { once: true })
    setTimeout(done, Math.min(20000, 1200 + String(text).length * 90))
  }

  return (
    <button
      type="button"
      className={`speak-btn ${size} ${playing ? 'is-playing' : ''} ${className}`}
      onClick={onClick}
      aria-label={label || 'listen'}
      title={label || 'listen'}
    >
      <span aria-hidden="true">{playing ? '⏹' : '🔊'}</span>
    </button>
  )
}
