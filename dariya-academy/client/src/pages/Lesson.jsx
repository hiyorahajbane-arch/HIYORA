import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { gloss, sectionText, target } from '../lib/content.js'
import { speechLang } from '../lib/speech.js'
import RichText from '../components/RichText.jsx'
import SpeakButton from '../components/SpeakButton.jsx'
import { Loading, ErrorState } from '../components/States.jsx'

export default function Lesson() {
  const { lessonId } = useParams()
  const { t, ui } = useI18n()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    api.lesson(lessonId).then(setData).catch(setError)
  }
  useEffect(load, [lessonId])

  if (error) return <ErrorState error={error} onRetry={load} />
  if (!data) return <Loading />

  const { lesson } = data
  const lang = speechLang(lesson.courseId)
  const courseName = lesson.courseId === 'darija' ? 'Darija' : lesson.courseId.toUpperCase()

  return (
    <div className="page lesson-page">
      <Link className="back" to={`/courses/${lesson.courseId}`}>← {t('lesson.backToCourse')}</Link>

      <header className="lesson-head">
        <span className="lesson-icon big" aria-hidden="true">{lesson.icon}</span>
        <div>
          <p className="eyebrow">{courseName} · {lesson.level}</p>
          <h1>{target(lesson.title, lesson.courseId)}</h1>
          <p className="muted">{gloss(lesson.subtitle, ui)}</p>
        </div>
        <div className="lesson-facts">
          <span>⏱ {lesson.duration} {t('common.minutes')}</span>
          <span>✏️ {data.exerciseCount}</span>
          <span>📖 {lesson.vocab.length}</span>
          <span className="xp">+{lesson.xp} {t('common.xp')}</span>
        </div>
      </header>

      {lesson.intro && (
        <div className="card intro">
          <p className="eyebrow">{t('lesson.goal')}</p>
          <RichText text={gloss(lesson.intro, ui)} />
        </div>
      )}

      {lesson.sections?.map((section, i) => (
        <section key={i} className="card lesson-section">
          <RichText text={sectionText(section.body, lesson.courseId, ui)} className="body-lg" />
          <SpeakButton text={sectionText(section.body, lesson.courseId, ui)} lang={lang} size="lg" />
        </section>
      ))}

      {lesson.examples?.length > 0 && (
        <section className="block">
          <h2>{t('lesson.example')}</h2>
          <div className="example-list">
            {lesson.examples.map((ex, i) => (
              <div key={i} className="card example">
                <div className="example-row">
                  <p className="example-src">{ex.source}</p>
                  <SpeakButton text={ex.source} lang={ex.audio || lang} />
                </div>
                <p className="muted">{gloss(ex.translation, ui)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {lesson.vocab?.length > 0 && (
        <section className="block">
          <h2>{t('lesson.vocab')}</h2>
          <div className="vocab-grid">
            {lesson.vocab.map((v, i) => (
              <div key={i} className="card vocab">
                <div className="vocab-top">
                  <strong>{v.word}</strong>
                  <SpeakButton text={v.word} lang={v.audio || lang} size="sm" />
                </div>
                <p className="muted">{gloss(v.translation, ui)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="lesson-cta">
        <Link className="btn primary big" to={`/lessons/${lesson.id}/quiz`}>
          {t('lesson.startQuiz')} · {data.exerciseCount}
        </Link>
      </div>
    </div>
  )
}
