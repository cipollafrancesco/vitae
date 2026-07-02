import { ReactNode } from 'react'

interface Props {
  index: number
  title?: ReactNode
  metaLines?: Array<string | false | null | undefined>
  bullets?: string[]
}

export function AtsEntry({ index, title, metaLines = [], bullets = [] }: Props) {
  const items = bullets.filter((b) => b.trim())
  return (
    <div className="ats-entry" data-rp-entry={index}>
      {title && <p className="ats-entry-title">{title}</p>}
      {metaLines.filter(Boolean).map((line, i) => (
        <p key={i} className="ats-entry-meta">
          {line}
        </p>
      ))}
      {items.length > 0 && (
        <ul className="ats-bullets">
          {items.map((b, j) => (
            <li key={j}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
