import { Layout } from './types'

const BODY_SECTION_IDS = ['experience', 'education', 'skills', 'projects', 'languages', 'interests']

export const DEFAULT_LAYOUT: Layout = {
  left: ['experience', 'education'],
  right: ['skills', 'projects', 'languages', 'interests'],
}

type Col = 'left' | 'right'

export function normalizeLayout(layout: Layout | undefined, customIds: string[]): Layout {
  const validIds = new Set<string>([...BODY_SECTION_IDS, ...customIds])
  const base = layout ?? DEFAULT_LAYOUT
  const seen = new Set<string>()
  const take = (arr: string[]) => {
    const out: string[] = []
    for (const id of arr ?? []) {
      if (validIds.has(id) && !seen.has(id)) {
        out.push(id)
        seen.add(id)
      }
    }
    return out
  }
  const left = take(base.left)
  const right = take(base.right)
  const fill = (target: string[], ids: string[]) => {
    for (const id of ids) {
      if (validIds.has(id) && !seen.has(id)) {
        target.push(id)
        seen.add(id)
      }
    }
  }
  fill(left, DEFAULT_LAYOUT.left)
  fill(right, DEFAULT_LAYOUT.right)
  fill(left, customIds)
  return { left, right }
}

export function moveWithin(layout: Layout, id: string, dir: -1 | 1): Layout {
  const inLeft = layout.left.includes(id)
  const arr = [...(inLeft ? layout.left : layout.right)]
  const i = arr.indexOf(id)
  const j = i + dir
  if (j < 0 || j >= arr.length) return layout
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  return inLeft ? { left: arr, right: layout.right } : { left: layout.left, right: arr }
}

export function toggleColumn(layout: Layout, id: string): Layout {
  if (layout.left.includes(id)) {
    return { left: layout.left.filter((x) => x !== id), right: [...layout.right, id] }
  }
  return { left: [...layout.left, id], right: layout.right.filter((x) => x !== id) }
}

export function dropBefore(
  layout: Layout,
  id: string,
  targetId: string | null,
  targetCol: Col,
): Layout {
  const left = layout.left.filter((x) => x !== id)
  const right = layout.right.filter((x) => x !== id)
  const arr = targetCol === 'left' ? left : right
  if (targetId == null) {
    arr.push(id)
  } else {
    const idx = arr.indexOf(targetId)
    arr.splice(idx === -1 ? arr.length : idx, 0, id)
  }
  return { left, right }
}
