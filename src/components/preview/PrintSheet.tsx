import { CSSProperties, ReactNode } from 'react'

interface Props {
  className: string
  style?: CSSProperties
  marginClass: string
  children: ReactNode
}

// A print sheet whose top/bottom page margins are created by a table thead/tfoot
// spacer. Chrome repeats thead/tfoot at the top/bottom of EVERY printed page, so the
// margins recur on page 2+ — unlike element padding (first/last page only) and unlike
// @page margins (which the build pipeline drops and the print dialog can override).
export function PrintSheet({ className, style, marginClass, children }: Props) {
  return (
    <div className={className} style={style}>
      <table className="sheet-table">
        <thead>
          <tr>
            <td>
              <div className={marginClass} />
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{children}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              <div className={marginClass} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
