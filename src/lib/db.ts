export interface StoredPanorama {
  id: string
  name: string
  blob: Blob
  createdAt: number
  /** URL publik saat mode remote (Supabase Storage); lokal memakai blob: */
  url?: string
}

export type AssetKind = "audio" | "image"

export interface StoredAsset {
  id: string
  sceneId: string
  kind: AssetKind
  name: string
  blob: Blob
  createdAt: number
}

const DB_NAME = "virtour360"
const STORE = "panoramas"
const ASSET_STORE = "assets"
const VERSION = 2

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function savePanorama(item: StoredPanorama): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPanoramas(): Promise<StoredPanorama[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as StoredPanorama[])
    req.onerror = () => reject(req.error)
  })
}

export async function deletePanorama(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ------------------------------------------------------------------ */
/* Aset scene: audio & gambar pengganti. Disimpan sebagai Blob agar      */
/* tetap ada setelah halaman dimuat ulang (object URL dibuat ulang).     */
/* ------------------------------------------------------------------ */

export async function saveAsset(item: StoredAsset): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_STORE, "readwrite")
    tx.objectStore(ASSET_STORE).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAssets(): Promise<StoredAsset[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_STORE, "readonly")
    const req = tx.objectStore(ASSET_STORE).getAll()
    req.onsuccess = () => resolve(req.result as StoredAsset[])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_STORE, "readwrite")
    tx.objectStore(ASSET_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteAssetsForScene(sceneId: string): Promise<void> {
  const assets = await getAssets()
  await Promise.all(assets.filter((a) => a.sceneId === sceneId).map((a) => deleteAsset(a.id)))
}
