const DB_NAME = 'BibleVersesGame';
const DB_VERSION = 3;
const STORE_NAMES = ['profile', 'achievements', 'verseStatus', 'customVerses', 'verseStats'] as const;

function openTestDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      for (const storeName of STORE_NAMES) {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName === 'profile') {
            db.createObjectStore(storeName, { keyPath: 'id' });
          } else if (storeName === 'achievements') {
            db.createObjectStore(storeName, { keyPath: 'achievementId' });
          } else if (storeName === 'verseStatus' || storeName === 'verseStats') {
            db.createObjectStore(storeName, { keyPath: 'verseId' });
          } else {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function resetAppDb(): Promise<void> {
  const db = await openTestDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([...STORE_NAMES], 'readwrite');
    for (const storeName of STORE_NAMES) {
      tx.objectStore(storeName).clear();
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  db.close();
}
