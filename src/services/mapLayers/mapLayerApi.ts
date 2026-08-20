/**
 * Real backend client for map layers (multi-layer).
 *
 * Endpoints:
 *   GET    /map-layers              → MapLayerDto[]
 *   GET    /map-layers/:id/file     → binary KMZ/KML
 *   POST   /map-layers              → multipart (file + meta) → MapLayerDto
 *   PATCH  /map-layers/:id          → JSON meta patch → MapLayerMeta
 *   DELETE /map-layers/:id          → 204
 */
import { API_BASE_URL } from '@/constants/config'
import { apiClient } from '@/services/api/client'
import { httpFormData } from '@/services/api/http'
import type { MapLayerDto, MapLayerMeta, MapLayerPackage } from './types'

function resolveFileUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
  return `${API_BASE_URL}${path}`
}

async function downloadAsFile(fileUrl: string, fileName: string): Promise<File> {
  const response = await fetch(resolveFileUrl(fileUrl), {
    headers: { Accept: 'application/octet-stream,application/vnd.google-earth.kmz,*/*' },
  })
  if (!response.ok) {
    throw new Error(`Không tải được file lớp bản đồ (${response.status})`)
  }
  const blob = await response.blob()
  return new File([blob], fileName || 'layer.kmz', {
    type: blob.type || 'application/octet-stream',
  })
}

export async function apiListMapLayers(): Promise<MapLayerPackage[]> {
  try {
    const list = await apiClient.get<MapLayerDto[]>('/map-layers')
    const packages: MapLayerPackage[] = []
    for (const dto of list) {
      const file = await downloadAsFile(
        dto.fileUrl || `/map-layers/${dto.id}/file`,
        dto.meta.fileName,
      )
      packages.push({
        meta: { ...dto.meta, id: dto.id || dto.meta.id },
        file,
      })
    }
    return packages
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    if (status === 404) return []
    throw error
  }
}

export async function apiUploadMapLayer(
  file: File,
  meta: MapLayerMeta,
): Promise<MapLayerPackage> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('meta', JSON.stringify(meta))
  form.append('id', meta.id)
  form.append('name', meta.name)
  form.append('fileName', meta.fileName)
  form.append('opacity', String(meta.opacity))
  form.append('weight', String(meta.weight))
  form.append('visible', String(meta.visible))
  form.append('color', meta.color)

  const dto = await httpFormData<MapLayerDto>('/map-layers', {
    method: 'POST',
    body: form,
  })

  return {
    meta: { ...dto.meta, id: dto.id || dto.meta.id || meta.id },
    file,
  }
}

export async function apiUpdateMapLayerMeta(
  id: string,
  patch: Partial<MapLayerMeta>,
): Promise<MapLayerMeta | null> {
  try {
    return await apiClient.patch<MapLayerMeta>(`/map-layers/${id}`, patch)
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    if (status === 404) return null
    throw error
  }
}

export async function apiDeleteMapLayer(id: string): Promise<void> {
  await apiClient.delete<void>(`/map-layers/${id}`)
}
