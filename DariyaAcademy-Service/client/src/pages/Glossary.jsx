import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { useI18n } from '../lib/i18n.jsx'
import { gloss, target } from '../lib/content.js'
import { speechLang } from '../lib/speech.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { Loading } from '../components/States.jsx'

const UI_GLOSS = {
  title: { darija: 'المسرد', ar: 'المسرد', fr: 'Lexique' },
  empty: { darija: 'ما لقينا حتى كلمة.', ar: 'لم نجد أي كلمة.', fr: 'Aucun mot trouvé.' },
  count: { darija: '{n} كلمة', ar: '{n} كلمة', fr: '{n} mots' },
  search: { darija: 'قلب على كلمة…', ar: 'ابحث عن كلمة…', fr: 'Chercher un mot…' },
}

export default function Glossary() {
  const { ui } = useI18n()
  const [courses, setCourses] = useState([])
  const [course, setCourse] = useState('')
  const [q, setQ] = useState('')
  const [words, setWords] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.courses().then((r) => setCourses(r.courses)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => {
      api
        .glossary({ course, q })
        .then((r) => setWords(r.words))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(id)
  }, [course, q])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const w of words || []) {
      const initial = String(w.word[0] || '#').toUpperCase()
      if (!map.has(initial)) map.set(initial, [])
      map.get(initial).push(w)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [words])

  const text = (key) => {
    const v = UI_GLOSS[key][ui] ?? UI_GLOSS[key].darija
    return v.replace('{n}', words?.length ?? 0)
  }

  return (
    <div className="page glossary-page">
      <h1>{text('title')}</h1>

      <div className="filters">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={text('search')}
          dir="auto"
        />
        <div className="chips">
          <button type="button" className={`chip ${course === '' ? 'on' : ''}`} onClick={() => setCourse('')}>
            {gloss({ darija: 'الكل', ar: 'الكل', fr: 'Tout' }, ui)}
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${course === c.id ? 'on' : ''}`}
              onClick={() => setCourse(c.id)}
            >
              <span aria-hidden="true">{c.flag}</span> {target(c.name, c.id)}
            </button>
          ))}
        </div>
      </div>

      <p className="muted">{text('count')}</p>

      {loading && <Loading />}
      {!loading && !words?.length && <p className="muted">{text('empty')}</p>}

      {!loading &&
        grouped.map(([letter, list]) => (
          <section key={letter} className="letter-block">
            <h2 className="letter">{letter}</h2>
            <div className="vocab-grid">
              {list.map((w, i) => (
                <div key={`${w.lessonId}-${i}`} className="card vocab">
                  <div className="vocab-top">
                    <strong dir="auto">{w.word}</strong>
                    <SpeakButton text={w.word} lang={w.audio || speechLang(w.courseId)} size="sm" />
                  </div>
                  <p className="muted">{gloss(w.translation, ui)}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
