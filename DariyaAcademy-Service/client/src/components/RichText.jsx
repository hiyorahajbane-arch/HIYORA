import { useMemo } from 'react'

/**
 * Content ships as a small subset of markdown: `**bold**`, `*italic*`, `* item`
 * bullets and `\n` line breaks. Rendering it by hand keeps the client free of a
 * markdown dependency (and of dangerouslySetInnerHTML on remote-ish text).
 */
function inline(text, keyBase) {
  const parts = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={`${keyBase}-b${i}`}>{token.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={`${keyBase}-i${i}`}>{token.slice(1, -1)}</em>)
    }
    last = m.index + token.length
    i++
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function RichText({ text, className = '' }) {
  const lines = useMemo(() => String(text || '').split('\n'), [text])
  const blocks = []
  let bullets = []

  const flush = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {bullets.map((b, i) => (
          <li key={i}>{inline(b.replace(/^\s*[-*•]\s*/, ''), `u${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((line, i) => {
    if (/^\s*[-*•]\s+/.test(line)) {
      bullets.push(line)
      return
    }
    flush()
    if (!line.trim()) {
      blocks.push(<div key={`sp-${i}`} className="sp" />)
    } else {
      blocks.push(<p key={`p-${i}`}>{inline(line, `p${i}`)}</p>)
    }
  })
  flush()

  return <div className={`rich ${className}`}>{blocks}</div>
}
