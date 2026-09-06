/**
 * Storage adapter interface for persistent offline queue data.
 * Adheres to RULE-MOB-05 and SRS FR-MOB-004.
 */

export interface OfflineStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory storage adapter for tests and lightweight non-native runtimes.
 */
export class InMemoryStorageAdapter implements OfflineStorageAdapter {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

/**
 * AsyncStorage-compatible adapter for React Native / Expo runtimes.
 * If native AsyncStorage is not linked, seamlessly falls back to in-memory store.
 */
export class AsyncStorageAdapter implements OfflineStorageAdapter {
  private fallbackStore = new InMemoryStorageAdapter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private nativeStorage: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(customStorage?: any) {
    if (customStorage) {
      this.nativeStorage = customStorage;
    } else {
      try {
        // Attempt dynamic resolution of global or package storage if installed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalStorage = (globalThis as any).AsyncStorage;
        if (globalStorage) {
          this.nativeStorage = globalStorage;
        }
      } catch {
        this.nativeStorage = null;
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (this.nativeStorage?.getItem) {
      try {
        return await this.nativeStorage.getItem(key);
      } catch {
        return this.fallbackStore.getItem(key);
      }
    }
    return this.fallbackStore.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.nativeStorage?.setItem) {
      try {
        await this.nativeStorage.setItem(key, value);
        return;
      } catch {
        await this.fallbackStore.setItem(key, value);
        return;
      }
    }
    await this.fallbackStore.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (this.nativeStorage?.removeItem) {
      try {
        await this.nativeStorage.removeItem(key);
        return;
      } catch {
        await this.fallbackStore.removeItem(key);
        return;
      }
    }
    await this.fallbackStore.removeItem(key);
  }

  async clear(): Promise<void> {
    if (this.nativeStorage?.clear) {
      try {
        await this.nativeStorage.clear();
        return;
      } catch {
        await this.fallbackStore.clear();
        return;
      }
    }
    await this.fallbackStore.clear();
  }
}
