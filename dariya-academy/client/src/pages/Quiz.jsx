import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { gloss, target } from '../lib/content.js'
import { dictate, recognitionSupported, speechLang } from '../lib/speech.js'
import RichText from '../components/RichText.jsx'
import SpeakButton from '../components/SpeakButton.jsx'
import { Loading, ErrorState } from '../components/States.jsx'

export default function Quiz() {
  const { lessonId } = useParams()
  const { t, ui } = useI18n()
  const { user, refresh } = useAuth()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState(null)
  const [exercises, setExercises] = useState([])
  const [error, setError] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState({})
  const [busy, setBusy] = useState(false)
  const [finished, setFinished] = useState(false)
  const [bonus, setBonus] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [micError, setMicError] = useState(null)
  const [listening, setListening] = useState(false)
  const [typed, setTyped] = useState('')
  const [order, setOrder] = useState([])

  useEffect(() => {
    if (!user) {
      navigate(`/login?next=/lessons/${lessonId}/quiz`, { replace: true })
    }
  }, [user, lessonId, navigate])

  useEffect(() => {
    Promise.all([api.lesson(lessonId), api.exercises(lessonId)])
      .then(([l, e]) => {
        setLesson(l.lesson)
        setExercises(e.exercises)
      })
      .catch(setError)
  }, [lessonId])

  const lang = useMemo(() => speechLang(lesson?.courseId), [lesson?.courseId])
  const exercise = exercises[index]

  const submit = useCallback(
    async (answer) => {
      if (!exercise) return
      setBusy(true)
      try {
        const r = await api.answer(lessonId, exercise.id, answer)
        setResults((prev) => ({ ...prev, [exercise.id]: r }))
        setAnswers((prev) => ({ ...prev, [exercise.id]: answer }))
      } catch (err) {
        setError(err)
      } finally {
        setBusy(false)
      }
    },
    [exercise, lessonId],
  )

  if (!user) return null
  if (error) return <ErrorState error={error} />
  if (!lesson || !exercises.length) return <Loading />

  const result = exercise ? results[exercise.id] : null
  const correctCount = Object.values(results).filter((r) => r.correct).length
  const xpEarned = Object.values(results).reduce((s, r) => s + (r.xp || 0), 0)
  const answeredCount = Object.keys(results).length

  const goNext = async () => {
    if (index < exercises.length - 1) {
      setIndex(index + 1)
      setTyped('')
      setOrder([])
      setTranscript('')
      setMicError(null)
      return
    }
    const done = await api.complete(lessonId).catch(() => null)
    setBonus(done)
    setFinished(true)
    refresh().catch(() => {})
  }

  if (finished) {
    const pct = Math.round((correctCount / exercises.length) * 100)
    return (
      <div className="page results">
        <div className="card results-card">
          <p className="eyebrow">{t('quiz.results')}</p>
          <h1>
            {target(lesson.title, lesson.courseId)}
          </h1>
          <div className="score-ring" style={{ '--pct': `${pct}%` }}>
            <strong>{pct}%</strong>
            <span>
              {correctCount}/{exercises.length}
            </span>
          </div>
          <div className="results-stats">
            <div>
              <b>{correctCount}</b>
              <span>{t('quiz.score')}</span>
            </div>
            <div>
              <b>{xpEarned}</b>
              <span>{t('quiz.earned')} {t('common.xp')}</span>
            </div>
            {bonus && (
              <div>
                <b>+{bonus.bonus}</b>
                <span>{t('quiz.finishBonus')}</span>
              </div>
            )}
            {bonus && (
              <div>
                <b>🔥 {bonus.streak}</b>
                <span>{t('quiz.streak')}</span>
              </div>
            )}
          </div>
          <div className="results-actions">
            <Link className="btn" to={`/lessons/${lesson.id}`}>{t('quiz.review')}</Link>
            <Link className="btn" to={`/courses/${lesson.courseId}`}>{t('nav.courses')}</Link>
            <Link className="btn primary" to="/progress">{t('nav.progress')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page quiz-page">
      <div className="quiz-bar">
        <Link className="back" to={`/lessons/${lesson.id}`}>← {t('common.back')}</Link>
        <span className="quiz-count">
          {t('quiz.q', { i: index + 1, n: exercises.length })}
        </span>
        <span className="quiz-done">
          ✓ {answeredCount}/{exercises.length}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${((index + (result ? 1 : 0)) / exercises.length) * 100}%` }} />
      </div>

      <div className="card quiz-card">
        <p className="eyebrow">{t(`quiz.type.${exercise.type}`)}</p>
        <RichText text={gloss(exercise.prompt, ui)} className="body-lg" />

        {exercise.type === 'mcq' && (
          <div className="options">
            {exercise.options.map((o, i) => (
              <button
                key={i}
                type="button"
                className={`option ${answers[exercise.id] === i ? 'picked' : ''}`}
                disabled={Boolean(result)}
                onClick={() => submit(i)}
              >
                <span className="option-key">{String.fromCharCode(65 + i)}</span>
                {o.text}
              </button>
            ))}
          </div>
        )}

        {exercise.type === 'listen' && (
          <>
            <div className="listen-row">
              <SpeakButton text={exercise.audioText} lang={exercise.audio || lang} size="xl" label={t('common.listen')} />
              <span className="muted small">{t('common.listen')} ×2</span>
            </div>
            <div className="options">
              {exercise.options.map((o, i) => (
                <button
                  key={i}
                  type="button"
                  className={`option ${answers[exercise.id] === i ? 'picked' : ''}`}
                  disabled={Boolean(result)}
                  onClick={() => submit(i)}
                >
                  <span className="option-key">{String.fromCharCode(65 + i)}</span>
                  {o.text}
                </button>
              ))}
            </div>
          </>
        )}

        {(exercise.type === 'fill' || exercise.type === 'translate') && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              if (typed.trim()) submit(typed)
            }}
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={Boolean(result)}
              placeholder={t(`quiz.type.${exercise.type}`)}
              dir="auto"
              autoFocus
            />
            {!result && (
              <button className="btn primary" type="submit" disabled={busy || !typed.trim()}>
                {t('quiz.check')}
              </button>
            )}
          </form>
        )}

        {exercise.type === 'speak' && (
          <div className="speak-box">
            <div className="speak-target">
              <p className="target-text">{exercise.audioText}</p>
              <SpeakButton text={exercise.audioText} lang={exercise.audio || lang} size="lg" />
            </div>
            {transcript && <p className="transcript">🎤 {transcript}</p>}
            {micError && <p className="form-error">⚠️ {micError}</p>}
            {!recognitionSupported && (
              <p className="muted small">
                {ui === 'fr'
                  ? 'La dictée n’est pas disponible dans ce navigateur. Écoutez et répétez à voix haute.'
                  : 'التسجيل الصوتي ماشي متاح فهاد المتصفح. سمع وعاود بجوجك.'}
              </p>
            )}
            {!result && (
              <button
                type="button"
                className={`btn primary ${listening ? 'rec' : ''}`}
                disabled={listening}
                onClick={() => {
                  setMicError(null)
                  setListening(true)
                  dictate(lang)
                    .then(({ transcript: text }) => {
                      setTranscript(text)
                      if (text) return submit(text)
                      return null
                    })
                    .catch((err) => setMicError(err.message))
                    .finally(() => setListening(false))
                }}
              >
                {listening ? '🎙 …' : '🎙 '}
                {gloss({ darija: 'سجل صوتك', ar: 'سجّل صوتك', fr: 'Enregistrer ma voix' }, ui)}
              </button>
            )}
          </div>
        )}

        {exercise.type === 'order' && (
          <OrderInput
            exercise={exercise}
            order={order}
            setOrder={setOrder}
            disabled={Boolean(result)}
            onSubmit={() => submit(order)}
            label={t('quiz.check')}
          />
        )}

        {result && (
          <div className={`verdict ${result.correct ? 'ok' : 'no'}`}>
            <p className="verdict-head">
              {result.correct ? `✅ ${t('quiz.correct')}` : `❌ ${t('quiz.wrong')}`}
              {typeof result.score === 'number' && result.correct && ` · ${result.score}%`}
            </p>
            {result.explanation && <RichText text={result.explanation} />}
            {result.firstTime && result.xp > 0 && <p className="xp-gain">+{result.xp} {t('common.xp')}</p>}
            {!result.firstTime && <p className="muted small">{t('quiz.tryAgain')}</p>}
            <button type="button" className="btn primary" onClick={goNext} disabled={busy}>
              {index === exercises.length - 1 ? t('quiz.finish') : t('quiz.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderInput({ exercise, order, setOrder, disabled, onSubmit, label }) {
  const pool = exercise.tokens || []

  return (
    <div className="order-box">
      <div className="order-slots">
        {order.length === 0 && <span className="muted">…</span>}
        {order.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            className="token picked"
            disabled={disabled}
            onClick={() => setOrder(order.filter((_, j) => j !== i))}
          >
            {w}
          </button>
        ))}
      </div>
      <div className="order-pool">
        {pool.map((w, i) => {
          const used = order.filter((x) => x === w).length
          const available = pool.filter((x) => x === w).length > used
          return (
            <button
              key={`${w}-${i}`}
              type="button"
              className="token"
              disabled={disabled || !available}
              onClick={() => setOrder([...order, w])}
            >
              {w}
            </button>
          )
        })}
      </div>
      {!disabled && (
        <button type="button" className="btn primary" onClick={onSubmit} disabled={!order.length}>
          {label}
        </button>
      )}
    </div>
  )
}
