export interface TripStorageDriver {
  load(key: string): string | null;
  save(key: string, value: string): void;
  remove(key: string): void;
}

export function createBrowserStorageDriver(): TripStorageDriver {
  return {
    load: (key) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
    save: (key, value) => {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    },
    remove: (key) => {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    },
  };
}
