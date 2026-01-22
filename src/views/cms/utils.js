
const CMS_BASE = import.meta.env.VITE_CMS_API_BASE || 'http://localhost:3003'

export const apiUrl = (pathname) => {
  const p = String(pathname || '')
  if (!p) return CMS_BASE
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  if (p.startsWith('/')) return `${CMS_BASE}${p}`
  return `${CMS_BASE}/${p}`
}

export const apiFetch = (pathname, init) => fetch(apiUrl(pathname), init)

export const normalizeUrl = (val) => {
  const u = String(val ?? '').trim()
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/uploads/') || u.startsWith('/assets/')) return apiUrl(u)
  return u
}

export const linkify = (text) => {
  const raw = String(text ?? '')
  return raw.replace(/(https?:\/\/[^\s]+)/g, "<a href='$1' target='_blank' rel='noopener'>$1</a>")
}

export const truncate = (str, len = 40) => {
  if (typeof str !== 'string') return str
  return str.length > len ? str.substring(0, len) + '...' : str
}

export const stripQuotes = (val) => {
  const trimmed = String(val ?? '').trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export const parseFrontmatter = (raw) => {
  const text = String(raw ?? '').replace(/\r\n/g, '\n')
  if (!text.startsWith('---\n')) return null
  const endIndex = text.indexOf('\n---', 4)
  if (endIndex === -1) return null
  const fmBlock = text.slice(4, endIndex).trimEnd()
  let contentStart = endIndex + '\n---'.length
  if (text[contentStart] === '\n') contentStart += 1
  const body = text.slice(contentStart).replace(/^\n+/, '')

  const fm = {}
  const tags = []
  let currentKey = null
  for (const line of fmBlock.split('\n')) {
    if (!line.trim()) continue
    const listMatch = line.match(/^\s*-\s+(.*)\s*$/)
    if (listMatch && currentKey === 'tags') {
      const t = stripQuotes(listMatch[1])
      if (t) tags.push(t)
      continue
    }

    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/)
    if (!kv) continue
    const key = kv[1]
    let value = kv[2] ?? ''
    currentKey = key

    if (!value.trim()) continue
    value = stripQuotes(value)

    if (key === 'tags') {
      const normalized = value.replace(/^\[|\]$/g, '')
      const inlineTags = normalized
        .split(/[,，]/)
        .map((t) => stripQuotes(t))
        .map((t) => t.trim())
        .filter(Boolean)
      tags.push(...inlineTags)
    } else {
      fm[key] = value
    }
  }

  if (tags.length) {
    fm.tags = Array.from(new Set(tags))
  }

  return { frontmatter: fm, body }
}
