export function BulletList({ bullets }: { bullets: string[] }) {
  const items = bullets.filter((b) => b.trim())
  if (!items.length) return null
  return (
    <div className="rp-bullet-list">
      {items.map((b, i) => (
        <div key={i} className="rp-bullet-item">
          <span className="rp-bullet-dash" aria-hidden="true">
            –
          </span>
          <span>{b}</span>
        </div>
      ))}
    </div>
  )
}
