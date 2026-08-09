/**
 * Real backend client for map layers.
 * Expected server layout: uploads/map-layers/active.kmz + meta.
 *
 * Endpoints:
 *   GET    /map-layers/active       → ActiveMapLayerDto | 404
 *   GET    /map-layers/active/file  → binary KMZ/KML
 *   POST   /map-layers/active       → multipart (file + meta fields) → ActiveMapLayerDto
 *   PATCH  /map-layers/active       → JSON meta patch → MapLayerMeta
 *   DELETE /map-layers/active       → 204
 */
import { API_BASE_URL } from '@/constants/config'
import { apiClient } from '@/services/api/client'
import { httpFormData } from '@/services/api/http'
import type { ActiveMapLayerDto, ActiveMapLayerPackage, MapLayerMeta } from './types'

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
  return new File([blob], fileName || 'active.kmz', {
    type: blob.type || 'application/octet-stream',
  })
}

export async function apiGetActiveMapLayer(): Promise<ActiveMapLayerPackage | null> {
  try {
    const dto = await apiClient.get<ActiveMapLayerDto>('/map-layers/active')
    const file = await downloadAsFile(dto.fileUrl || '/map-layers/active/file', dto.meta.fileName)
    return { meta: dto.meta, file }
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    if (status === 404) return null
    throw error
  }
}

export async function apiUploadActiveMapLayer(
  file: File,
  meta: MapLayerMeta,
): Promise<ActiveMapLayerPackage> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('meta', JSON.stringify(meta))
  form.append('name', meta.name)
  form.append('fileName', meta.fileName)
  form.append('opacity', String(meta.opacity))
  form.append('weight', String(meta.weight))
  form.append('visible', String(meta.visible))
  form.append('color', meta.color)

  const dto = await httpFormData<ActiveMapLayerDto>('/map-layers/active', {
    method: 'POST',
    body: form,
  })

  return { meta: dto.meta, file }
}

export async function apiUpdateActiveMapLayerMeta(
  patch: Partial<MapLayerMeta>,
): Promise<MapLayerMeta | null> {
  try {
    return await apiClient.patch<MapLayerMeta>('/map-layers/active', patch)
  } catch (error) {
    const status = (error as { status?: number } | null)?.status
    if (status === 404) return null
    throw error
  }
}

export async function apiDeleteActiveMapLayer(): Promise<void> {
  await apiClient.delete<void>('/map-layers/active')
}
