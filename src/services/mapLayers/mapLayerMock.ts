/**
 * Mock of server `uploads/map-layers/` using IndexedDB.
 * One active KMZ/KML + meta — same contract as the future API.
 */
import type { ActiveMapLayerPackage, MapLayerMeta } from './types'

const DB_NAME = 'scadaweb-map-layers-mock'
const DB_VERSION = 1
const STORE_NAME = 'uploads'
/** Mimics uploads/map-layers/active.* on the server. */
const RECORD_KEY = 'map-layers/active'

type PersistedRecord = {
  key: typeof RECORD_KEY
  file: Blob
  meta: MapLayerMeta
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

export async function mockGetActiveMapLayer(): Promise<ActiveMapLayerPackage | null> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const existing = (await idbRequest(
      tx.objectStore(STORE_NAME).get(RECORD_KEY),
    )) as PersistedRecord | undefined
    if (!existing?.file) return null

    const file = new File([existing.file], existing.meta.fileName || 'active.kmz', {
      type: existing.file.type || 'application/octet-stream',
    })
    return { file, meta: existing.meta }
  } finally {
    db.close()
  }
}

export async function mockUploadActiveMapLayer(
  file: File,
  meta: MapLayerMeta,
): Promise<ActiveMapLayerPackage> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    const record: PersistedRecord = {
      key: RECORD_KEY,
      file: file.slice(0, file.size, file.type || 'application/octet-stream'),
      meta,
    }
    store.put(record)
    await idbTransactionDone(tx)
  } finally {
    db.close()
  }

  return { file, meta }
}

export async function mockUpdateActiveMapLayerMeta(
  patch: Partial<MapLayerMeta>,
): Promise<MapLayerMeta | null> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const existing = (await idbRequest(store.get(RECORD_KEY))) as PersistedRecord | undefined
    if (!existing) return null
    existing.meta = { ...existing.meta, ...patch }
    store.put(existing)
    await idbTransactionDone(tx)
    return existing.meta
  } finally {
    db.close()
  }
}

export async function mockDeleteActiveMapLayer(): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await idbTransactionDone(tx)
  } finally {
    db.close()
  }
}
