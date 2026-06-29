/**
 * Static.ts — Persistent value wrapper using chrome.storage.local
 * Ported from Static.js (1-click-timer v8.3.1)
 *
 * MV3 change: Uses chrome.storage.local instead of localStorage
 * because service workers don't have access to localStorage.
 */

const STORAGE_PREFIX = "timer.";

export class Static<T> {
  private key: string;
  private defaultValue: T;

  /**
   * @param key - unique key (should be unique across the entire application)
   * @param defaultValue - fallback value used when no stored value exists
   */
  constructor(key: string, defaultValue: T) {
    this.key = STORAGE_PREFIX + key;
    this.defaultValue = defaultValue;
  }

  /** Resets the value to its default and returns it */
  async reset(): Promise<T> {
    return this.save(this.defaultValue);
  }

  /** Loads the value from chrome.storage.local */
  async load(): Promise<T> {
    try {
      const result = await chrome.storage.local.get(this.key);
      const raw = result[this.key];
      if (raw !== undefined) {
        // The original stored data as JSON-wrapped { value: ... }
        if (typeof raw === "object" && raw !== null && "value" in raw) {
          return (raw as { value: T }).value as T;
        }
        console.warn(
          `Invalid object stored for "${this.key}" in storage:`,
          raw,
          "Loading default.",
        );
      }
    } catch (e) {
      console.warn(
        `Error loading "${this.key}" from storage:`,
        e,
        "Loading default.",
      );
    }
    return this.reset();
  }

  /** Saves a value to chrome.storage.local and returns the confirmed value */
  async save(value: T): Promise<T> {
    await chrome.storage.local.set({ [this.key]: { value } });
    return this.load();
  }
}
