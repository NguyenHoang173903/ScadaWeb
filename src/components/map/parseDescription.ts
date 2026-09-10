export type DescriptionBlock =
  | { kind: 'section'; title: string }
  | { kind: 'row'; label: string; value: string }
  | { kind: 'text'; text: string }
  | { kind: 'images'; urls: string[] }

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const IMAGE_PATH = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i

function prepareDescriptionHtml(description: string): string {
  let html = description
  for (let i = 0; i < 2; i += 1) {
    if (/<img\b/i.test(html) || /<a\b[^>]*href/i.test(html)) break
    if (/&lt;img\b/i.test(html) || /&lt;a\b/i.test(html)) {
      html = decodeEntities(html)
    } else {
      break
    }
  }
  return html
}

export function resolveMediaUrl(
  src: string,
  mediaBaseUrl?: string,
  mediaUrls?: Record<string, string>,
): string {
  const trimmed = decodeEntities(src).trim()
  if (!trimmed) return trimmed
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed

  const relative = trimmed.replace(/^\.\//, '').replace(/^\//, '').replace(/\\/g, '/')

  if (mediaUrls && Object.keys(mediaUrls).length > 0) {
    const candidates = [relative, relative.toLowerCase()]
    try {
      candidates.push(decodeURIComponent(relative), decodeURIComponent(relative).toLowerCase())
    } catch {
      // ignore malformed percent-encoding
    }

    for (const key of candidates) {
      if (mediaUrls[key]) return mediaUrls[key]
    }

    const baseName = relative.split('/').pop()
    if (baseName) {
      const byName = mediaUrls[baseName] ?? mediaUrls[baseName.toLowerCase()]
      if (byName) return byName
      const nested = mediaUrls[`files/${baseName}`] ?? mediaUrls[`files/${baseName}`.toLowerCase()]
      if (nested) return nested
    }
  }

  const base = (mediaBaseUrl || '/map-layers/').replace(/\/?$/, '/')
  const encoded = relative
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${base}${encoded}`
}

function collectAttr(html: string, tag: string, attr: string): string[] {
  const urls: string[] = []
  const re = new RegExp(
    `<${tag}\\b[^>]*?\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'gi',
  )
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const value = match[1] ?? match[2] ?? match[3]
    if (value) urls.push(decodeEntities(value).trim())
  }
  return urls
}

function extractImgSrcs(html: string): string[] {
  const fromImg = collectAttr(html, 'img', 'src')
  const fromHref = collectAttr(html, 'a', 'href').filter(
    (href) => IMAGE_PATH.test(href) || /(?:^|\/)files\//i.test(href),
  )
  return [...new Set([...fromImg, ...fromHref])]
}

export function normalizeDescription(description: unknown): string {
  if (typeof description === 'string') return description
  if (description && typeof description === 'object' && 'value' in description) {
    const value = (description as { value?: unknown }).value
    if (typeof value === 'string') return value
  }
  return ''
}

/** Parse KML description HTML into structured blocks (Google Earth style). */
export function parseDescriptionBlocks(
  description: string,
  mediaBaseUrl?: string,
  mediaUrls?: Record<string, string>,
): DescriptionBlock[] {
  const html = prepareDescriptionHtml(description)
  const imageUrls = extractImgSrcs(html).map((src) =>
    resolveMediaUrl(src, mediaBaseUrl, mediaUrls),
  )

  const text = decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img\b[^>]*>/gi, '\n')
      .replace(/<\/?table[^>]*>/gi, '\n')
      .replace(/<\/?tr[^>]*>/gi, '\n')
      .replace(/<\/?td[^>]*>/gi, ' ')
      .replace(/<\/?th[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )

  const blocks: DescriptionBlock[] = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim().replace(/^"+|"+$/g, '').trim()
    if (!line || line === '<![CDATA[' || line === ']]>') continue

    if (/^\d+\.\s+\S/.test(line) && !line.includes(':')) {
      blocks.push({ kind: 'section', title: line })
      continue
    }

    const colonIdx = line.indexOf(':')
    if (colonIdx > 0 && colonIdx < 48) {
      const label = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      if (label) {
        blocks.push({ kind: 'row', label, value: value || '—' })
        continue
      }
    }

    blocks.push({ kind: 'text', text: line })
  }

  if (imageUrls.length > 0) {
    const hasImageSection = blocks.some(
      (block) => block.kind === 'section' && /hình ảnh|anh|image/i.test(block.title),
    )
    if (!hasImageSection) {
      blocks.push({ kind: 'section', title: 'Hình ảnh hiện trạng' })
    }
    blocks.push({ kind: 'images', urls: imageUrls })
  }

  return blocks
}
