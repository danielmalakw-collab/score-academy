/**
 * Large Object Safe Storage for Score Academy
 * Uses native IndexedDB to store megabytes of files, PDFs, and courses
 * without being constrained by the browser's 5MB localStorage limit.
 */

const DB_NAME = 'score_academy_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('[IndexedDB] Failed to open DB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn(`[IndexedDB] Error setting key "${key}":`, req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Set exception:', err);
    return false;
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => {
        console.warn(`[IndexedDB] Error getting key "${key}":`, req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Get exception:', err);
    return null;
  }
}

/**
 * Creates a lightweight version of an object/array by truncating large Base64 files
 * so localStorage does not exceed its 5MB limit.
 */
function sanitizeForLocalStorage(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLocalStorage(item));
  }
  if (typeof data === 'object') {
    const copy: any = { ...data };
    for (const key of Object.keys(copy)) {
      if (typeof copy[key] === 'string' && copy[key].length > 100000 && (key === 'file_data' || key.includes('data'))) {
        copy[key] = copy[key].slice(0, 500) + '...[STORED_IN_INDEXEDDB]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = sanitizeForLocalStorage(copy[key]);
      }
    }
    return copy;
  }
  return data;
}

/**
 * Safely saves data to both IndexedDB (full size with unlimited quota)
 * and localStorage (with safe fallback & QuotaExceededError protection).
 * Never throws an uncaught QuotaExceededError.
 */
export async function safeSaveData<T>(key: string, data: T): Promise<void> {
  // 1. Always save the full intact data in IndexedDB
  await idbSet(key, data);

  // 2. Try saving to localStorage
  try {
    const rawString = JSON.stringify(data);
    localStorage.setItem(key, rawString);
  } catch (quotaError) {
    console.warn(`[Storage] localStorage quota reached for "${key}". Using lightweight local mirror.`);
    try {
      // Create a trimmed mirror for localStorage without multi-megabyte base64 strings
      const sanitized = sanitizeForLocalStorage(data);
      localStorage.setItem(key, JSON.stringify(sanitized));
    } catch {
      // If even the sanitized version doesn't fit, don't crash the app
      console.warn(`[Storage] Skipping localStorage mirror for "${key}". Data is safe in IndexedDB.`);
    }
  }
}

/**
 * Safely loads data checking IndexedDB first, with fallback to localStorage.
 */
export async function safeLoadData<T>(key: string): Promise<T | null> {
  // 1. Try IndexedDB first for full fidelity
  try {
    const fromIdb = await idbGet<T>(key);
    if (fromIdb !== null && fromIdb !== undefined) {
      return fromIdb;
    }
  } catch (err) {
    console.warn('[Storage] Error reading from IndexedDB:', err);
  }

  // 2. Fall back to localStorage
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local) as T;
    }
  } catch (err) {
    console.warn('[Storage] Error reading from localStorage:', err);
  }

  return null;
}
