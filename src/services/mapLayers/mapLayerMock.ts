/**
 * Mock of server `uploads/map-layers/` using IndexedDB.
 * Supports multiple KMZ/KML layers — upload adds, delete removes by id.
 * Parsed GeoJSON is cached in IDB so reload does not re-unzip KMZ.
 */
import type { FeatureCollection } from 'geojson'
import type { MapLayerMeta, MapLayerPackage } from './types'

const DB_NAME = 'scadaweb-map-layers-mock'
const DB_VERSION = 2
const STORE_NAME = 'uploads'
/** Legacy single-layer key from v1 — migrated on read. */
const LEGACY_ACTIVE_KEY = 'map-layers/active'

type PersistedRecord = {
  key: string
  file: Blob
  meta: MapLayerMeta
  /** Cached parse result — avoids KMZ unzip on every page reload */
  geojson?: FeatureCollection
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function idbTransactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function toPackage(record: PersistedRecord): MapLayerPackage {
  const file = new File([record.file], record.meta.fileName || 'layer.kmz', {
    type: record.file.type || 'application/octet-stream',
  })
  return { file, meta: record.meta, geojson: record.geojson }
}

function normalizeMeta(meta: MapLayerMeta, key: string): MapLayerMeta {
  return {
    ...meta,
    id: meta.id || key,
  }
}

export async function mockListMapLayers(): Promise<MapLayerPackage[]> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const all = (await idbRequest(store.getAll())) as PersistedRecord[]
    const packages: MapLayerPackage[] = []

    for (const record of all) {
      if (!record?.file) continue

      // Migrate legacy single-active record to a unique layer id.
      if (record.key === LEGACY_ACTIVE_KEY) {
        const meta = normalizeMeta(record.meta, record.meta.id || `layer-migrated-${Date.now()}`)
        const migrated: PersistedRecord = {
          key: meta.id,
          file: record.file,
          meta,
          geojson: record.geojson,
        }
        store.delete(LEGACY_ACTIVE_KEY)
        store.put(migrated)
        packages.push(toPackage(migrated))
        continue
      }

      const meta = normalizeMeta(record.meta, record.key)
      if (meta.id !== record.meta.id) {
        record.meta = meta
        store.put(record)
      }
      packages.push(toPackage(record))
    }

    await idbTransactionDone(tx)
    return packages
  } finally {
    db.close()
  }
}

export async function mockUploadMapLayer(
  file: File,
  meta: MapLayerMeta,
  geojson?: FeatureCollection,
): Promise<MapLayerPackage> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const record: PersistedRecord = {
      key: meta.id,
      file: file.slice(0, file.size, file.type || 'application/octet-stream'),
      meta,
      geojson,
    }
    store.put(record)
    await idbTransactionDone(tx)
  } finally {
    db.close()
  }

  return { file, meta, geojson }
}

export async function mockSaveLayerGeojson(
  id: string,
  geojson: FeatureCollection,
): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const existing = (await idbRequest(store.get(id))) as PersistedRecord | undefined
    if (!existing) return
    existing.geojson = geojson
    store.put(existing)
    await idbTransactionDone(tx)
  } finally {
    db.close()
  }
}

export async function mockUpdateMapLayerMeta(
  id: string,
  patch: Partial<MapLayerMeta>,
): Promise<MapLayerMeta | null> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const existing = (await idbRequest(store.get(id))) as PersistedRecord | undefined
    if (!existing) return null
    existing.meta = { ...existing.meta, ...patch, id }
    store.put(existing)
    await idbTransactionDone(tx)
    return existing.meta
  } finally {
    db.close()
  }
}

export async function mockDeleteMapLayer(id: string): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    await idbTransactionDone(tx)
  } finally {
    db.close()
  }
}
