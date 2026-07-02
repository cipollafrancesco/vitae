interface PillProps {
  label: string
  variant: 'solid' | 'outline'
  index?: number
}

export function Pill({ label, variant, index }: PillProps) {
  return (
    <span
      className={`rp-pill ${variant === 'solid' ? 'rp-pill-solid' : 'rp-pill-outline'}`}
      data-rp-entry={index}
    >
      {label}
    </span>
  )
}
