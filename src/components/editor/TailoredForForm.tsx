'use client'

import { Field } from './Field'

export function TailoredForForm() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Private note — not shown on the resume. Useful for tracking which job this variant was
        fine-tuned for.
      </p>
      <Field
        label="Company"
        name="tailoredFor.company"
        placeholder="e.g. Acme Inc."
        dataField="company"
      />
      <Field
        label="Position"
        name="tailoredFor.position"
        placeholder="e.g. Senior Product Manager"
        dataField="position"
      />
    </div>
  )
}
