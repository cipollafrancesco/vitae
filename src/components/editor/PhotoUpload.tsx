'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { FormResume } from '@/lib/types'
import { IconPerson } from '@/components/preview/primitives/Icons'

const MAX_DIMENSION = 480
const JPEG_QUALITY = 0.85

// Resumes get autosaved to localStorage on every edit, and an unscaled phone photo can be
// several megabytes — comfortably enough to blow the ~5MB quota on its own. Downscaling to
// a size well past what a 36mm circular print avatar ever needs keeps the stored resume small.
async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export function PhotoUpload() {
  const { setValue, control } = useFormContext<FormResume>()
  const photoUrl = useWatch({ control, name: 'profile.photoUrl' })

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      setValue('profile.photoUrl', dataUrl, { shouldDirty: true })
    } catch {
      alert('Could not process that image. Please try a different file.')
    }
  }

  return (
    <div className="flex items-center gap-3" data-field="photo">
      <div
        className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
        style={{ background: 'var(--accent, #292929)' }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Profile photo"
            className="w-full h-full object-cover rounded-full outline outline-1 -outline-offset-1 outline-black/10"
          />
        ) : (
          <IconPerson className="w-1/2 h-1/2 text-white opacity-60" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
          Upload photo
          <input type="file" accept="image/*" onChange={handleChange} className="sr-only" />
        </label>
        {photoUrl && (
          <button
            type="button"
            onClick={() => setValue('profile.photoUrl', '', { shouldDirty: true })}
            className="text-xs text-red-400 hover:text-red-600 text-left"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
