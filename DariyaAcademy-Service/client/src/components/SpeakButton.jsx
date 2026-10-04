import { useEffect, useState } from 'react'
import { speak, speechSupported, stopSpeaking } from '../lib/speech.js'

/** 🔊 button that reads any string aloud in the right voice. */
export default function SpeakButton({ text, lang, label, className = '', size = 'md' }) {
  const [playing, setPlaying] = useState(false)

  // Stop speech if the component unmounts while playing.
  useEffect(() => () => stopSpeaking(), [])

  if (!text) return null

  // Don't disappear silently: show why there is no sound.
  if (!speechSupported) {
    return (
      <button
        type="button"
        className={`speak-btn ${size} ${className}`}
        disabled
        title="المتصفح ديالك ما كيدعمش الصوت. جرب Chrome."
        aria-label="no audio support"
      >
        <span aria-hidden="true">🔇</span>
      </button>
    )
  }

  const onClick = async () => {
    if (playing) {
      stopSpeaking()
      setPlaying(false)
      return
    }
    setPlaying(true)
    try {
      await speak(text, lang)
    } finally {
      setPlaying(false)
    }
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
