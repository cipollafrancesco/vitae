import { ReactNode } from 'react'

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-brand hover:text-brand-600 border border-dashed border-brand/40 rounded-lg py-2 hover:bg-brand/10 transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]"
    >
      {children}
    </button>
  )
}
