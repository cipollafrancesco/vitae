import { ReactNode } from 'react'

// Entry title line. When `dateInline` is on and a dateRange exists, the date is
// shown right-aligned on the same line as the title; otherwise the title renders alone.
export function EntryTitle({
  className,
  title,
  dateRange,
  dateInline,
}: {
  className: string
  title: ReactNode
  dateRange?: string
  dateInline?: boolean
}) {
  if (dateInline && dateRange) {
    return (
      <div className="rp-title-row">
        <p className={className}>{title}</p>
        <span className="rp-date-inline">{dateRange}</span>
      </div>
    )
  }
  return <p className={className}>{title}</p>
}

// The italic meta row below the title. Default: dateRange (left) + location (right).
// When `dateInline` is on, the dateRange has moved to the title line, so this shows
// only the location (left-aligned) — or nothing if there's no location.
export function EntryMeta({
  dateRange,
  location,
  dateInline,
}: {
  dateRange?: string
  location?: string
  dateInline?: boolean
}) {
  if (dateInline) {
    return location ? (
      <div className="rp-date-row">
        <span>{location}</span>
      </div>
    ) : null
  }
  if (!dateRange && !location) return null
  return (
    <div className="rp-date-row">
      {dateRange && <span>{dateRange}</span>}
      {location && <span>{location}</span>}
    </div>
  )
}
