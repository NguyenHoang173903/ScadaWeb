import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
import type { Connect, Plugin } from 'vite'

type LayerMeta = {
  id: string
  name: string
  fileName: string
  opacity: number
  weight: number
  visible: boolean
  color: string
}

type ManifestLayer = {
  id: string
  meta: LayerMeta
  fileName: string
  fileUrl: string
  geojsonUrl?: string
  /** Static base for KMZ-embedded images, e.g. /map-layers/{id}/ */
  mediaBaseUrl?: string
}

type Manifest = {
  layers: ManifestLayer[]
}

const API_PREFIX = '/__map-layers'
/** Skip media extract for huge canal KMZs (images rarely needed; unzip is costly). */
const MAX_KMZ_MEDIA_BYTES = 40 * 1024 * 1024

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function parseMultipart(buffer: Buffer, boundary: string) {
  const parts = new Map<string, { filename?: string; data: Buffer; mime?: string }>()
  const delim = Buffer.from(`--${boundary}`)
  let start = buffer.indexOf(delim) + delim.length

  while (start !== -1 && start < buffer.length) {
    if (buffer[start] === 0x2d && buffer[start + 1] === 0x2d) break // --
    if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) start += 2

    const headerEnd = buffer.indexOf('\r\n\r\n', start)
    if (headerEnd === -1) break
    const headerText = buffer.slice(start, headerEnd).toString('utf8')
    const nextDelim = buffer.indexOf(delim, headerEnd + 4)
    const end = nextDelim === -1 ? buffer.length : nextDelim - 2 // trim \r\n
    const data = buffer.slice(headerEnd + 4, end)

    const nameMatch = /name="([^"]+)"/i.exec(headerText)
    const fileMatch = /filename="([^"]*)"/i.exec(headerText)
    const typeMatch = /Content-Type:\s*(.+)/i.exec(headerText)
    if (nameMatch) {
      parts.set(nameMatch[1], {
        filename: fileMatch?.[1] || undefined,
        data,
        mime: typeMatch?.[1]?.trim(),
      })
    }
    start = nextDelim === -1 ? -1 : nextDelim + delim.length
  }

  return parts
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function readManifest(manifestPath: string): Promise<Manifest> {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8')
    const parsed = JSON.parse(raw) as Manifest
    return { layers: Array.isArray(parsed.layers) ? parsed.layers : [] }
  } catch {
    return { layers: [] }
  }
}

async function writeManifest(manifestPath: string, manifest: Manifest) {
  await ensureDir(path.dirname(manifestPath))
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

function layerMediaBaseUrl(layerId: string) {
  return `/map-layers/${layerId}/`
}

/** Unpack KMZ sidecar images (files/*.jpg, …) next to the KMZ for static serving. */
async function extractKmzMediaToDisk(kmzBuffer: Buffer, layerDir: string) {
  if (kmzBuffer.byteLength > MAX_KMZ_MEDIA_BYTES) return

  const zip = await JSZip.loadAsync(kmzBuffer)
  const entries = Object.values(zip.files).filter((entry) => !entry.dir)

  for (const entry of entries) {
    const normalized = entry.name.replace(/\\/g, '/')
    if (!normalized || normalized.includes('..')) continue
    if (normalized.toLowerCase().endsWith('.kml')) continue

    const outPath = path.join(layerDir, ...normalized.split('/'))
    await ensureDir(path.dirname(outPath))
    const data = await entry.async('nodebuffer')
    await fs.writeFile(outPath, data)
  }
}

async function ensureLayerMediaExtracted(layerDir: string, fileName: string) {
  const filesDir = path.join(layerDir, 'files')
  try {
    const kids = await fs.readdir(filesDir)
    if (kids.length > 0) return
  } catch {
    // files/ missing — try extract
  }

  let kmzPath = path.join(layerDir, fileName)
  try {
    await fs.access(kmzPath)
  } catch {
    try {
      const names = await fs.readdir(layerDir)
      const found = names.find((name) => name.toLowerCase().endsWith('.kmz'))
      if (!found) return
      kmzPath = path.join(layerDir, found)
    } catch {
      return
    }
  }

  if (!kmzPath.toLowerCase().endsWith('.kmz')) return

  try {
    const stat = await fs.stat(kmzPath)
    if (stat.size > MAX_KMZ_MEDIA_BYTES) return
    const buffer = await fs.readFile(kmzPath)
    await extractKmzMediaToDisk(buffer, layerDir)
  } catch {
    // KMZ missing or unreadable — ignore
  }
}

/**
 * Persist uploaded KMZ/KML under `public/map-layers/` during Vite dev/preview.
 * Static files remain readable after reload via `/map-layers/...`.
 */
export function mapLayersFsPlugin(projectRoot: string): Plugin {
  const layersRoot = path.resolve(projectRoot, 'public/map-layers')
  const manifestPath = path.join(layersRoot, 'manifest.json')

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost')
      if (!url.pathname.startsWith(API_PREFIX)) {
        next()
        return
      }

      await ensureDir(layersRoot)

      // GET /__map-layers
      if (req.method === 'GET' && url.pathname === API_PREFIX) {
        const manifest = await readManifest(manifestPath)
        let changed = false
        for (const layer of manifest.layers) {
          if (!layer.mediaBaseUrl) {
            layer.mediaBaseUrl = layerMediaBaseUrl(layer.id)
            changed = true
          }
          await ensureLayerMediaExtracted(
            path.join(layersRoot, layer.id),
            layer.fileName || layer.meta.fileName,
          )
        }
        if (changed) await writeManifest(manifestPath, manifest)
        sendJson(res, 200, manifest.layers)
        return
      }

      // POST /__map-layers
      if (req.method === 'POST' && url.pathname === API_PREFIX) {
        const contentType = req.headers['content-type'] || ''
        const boundaryMatch = /boundary=(.+)$/i.exec(contentType)
        if (!boundaryMatch) {
          sendJson(res, 400, { message: 'Expected multipart/form-data' })
          return
        }

        const body = await readBody(req)
        const parts = parseMultipart(body, boundaryMatch[1].trim())
        const filePart = parts.get('file')
        const metaPart = parts.get('meta')
        const geojsonPart = parts.get('geojson')

        if (!filePart?.data?.length || !metaPart) {
          sendJson(res, 400, { message: 'Missing file or meta' })
          return
        }

        const meta = JSON.parse(metaPart.data.toString('utf8')) as LayerMeta
        const layerDir = path.join(layersRoot, meta.id)
        await ensureDir(layerDir)

        const safeName = (filePart.filename || meta.fileName || 'layer.kmz').replace(
          /[<>:"/\\|?*\u0000-\u001f]/g,
          '_',
        )
        const filePath = path.join(layerDir, safeName)
        await fs.writeFile(filePath, filePart.data)

        if (safeName.toLowerCase().endsWith('.kmz')) {
          await extractKmzMediaToDisk(filePart.data, layerDir)
        }

        let geojsonUrl: string | undefined
        if (geojsonPart?.data?.length) {
          const geoPath = path.join(layerDir, 'geometry.geojson')
          await fs.writeFile(geoPath, geojsonPart.data)
          geojsonUrl = `/map-layers/${meta.id}/geometry.geojson`
        }

        const entry: ManifestLayer = {
          id: meta.id,
          meta: { ...meta, fileName: safeName },
          fileName: safeName,
          fileUrl: `/map-layers/${meta.id}/${encodeURIComponent(safeName)}`,
          geojsonUrl,
          mediaBaseUrl: layerMediaBaseUrl(meta.id),
        }

        const manifest = await readManifest(manifestPath)
        const idx = manifest.layers.findIndex((layer) => layer.id === meta.id)
        if (idx >= 0) manifest.layers[idx] = entry
        else manifest.layers.push(entry)
        await writeManifest(manifestPath, manifest)

        sendJson(res, 200, entry)
        return
      }

      // PATCH /__map-layers/:id
      const patchMatch = /^\/__map-layers\/([^/]+)$/.exec(url.pathname)
      if (req.method === 'PATCH' && patchMatch) {
        const id = decodeURIComponent(patchMatch[1])
        const body = JSON.parse((await readBody(req)).toString('utf8')) as Partial<LayerMeta>
        const manifest = await readManifest(manifestPath)
        const layer = manifest.layers.find((item) => item.id === id)
        if (!layer) {
          sendJson(res, 404, { message: 'Layer not found' })
          return
        }
        layer.meta = { ...layer.meta, ...body, id }
        await writeManifest(manifestPath, manifest)
        sendJson(res, 200, layer.meta)
        return
      }

      // DELETE /__map-layers/:id
      if (req.method === 'DELETE' && patchMatch) {
        const id = decodeURIComponent(patchMatch[1])
        const manifest = await readManifest(manifestPath)
        manifest.layers = manifest.layers.filter((item) => item.id !== id)
        await writeManifest(manifestPath, manifest)
        await fs.rm(path.join(layersRoot, id), { recursive: true, force: true })
        res.statusCode = 204
        res.end()
        return
      }

      sendJson(res, 404, { message: 'Not found' })
    } catch (error) {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : 'Map layer FS error',
      })
    }
  }

  return {
    name: 'map-layers-fs',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
