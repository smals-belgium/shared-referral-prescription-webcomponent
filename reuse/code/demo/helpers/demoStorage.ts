// demoStorage.ts
let storageAvailable = false;
const memoryStorage: Record<string, object> = {};

try {
  const testKey = '__demo_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  storageAvailable = true;
} catch {
  storageAvailable = false;
}

export const demoStorage = {
  set: (key: string, value: object) => {
    if (storageAvailable) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      memoryStorage[key] = value;
    }
  },
  get: <T>(key: string, validator?: (data: unknown) => data is T): T | null => {
    let raw: unknown;
    if (storageAvailable) {
      const item = localStorage.getItem(key);
      raw = item ? JSON.parse(item) : null;
    } else {
      raw = memoryStorage[key] ?? null;
    }

    if (raw === null) return null;
    if (validator && !validator(raw)) return null;

    return raw as T;
  },
  remove: (key: string) => {
    if (storageAvailable) {
      localStorage.removeItem(key);
    } else {
      delete memoryStorage[key];
    }
  },
  clear: () => {
    if (storageAvailable) {
      localStorage.clear();
    } else {
      for (const key of Object.keys(memoryStorage)) {
        delete memoryStorage[key];
      }
    }
  },
};
