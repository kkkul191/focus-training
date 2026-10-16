import { beforeEach, describe, expect, it } from "vitest";
import { storageService, validateImportedData } from "@/src/services/storage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

beforeEach(() => Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: new MemoryStorage() } }));

describe("storage service", () => {
  it("saves and retrieves focus sessions through one data layer", () => {
    storageService.saveSession({ id: "s1", date: new Date().toISOString(), task: "Read", plannedDuration: 25, actualDuration: 25, completed: true, completionRate: 100, subjectiveFocusScore: 4, events: [] });
    expect(storageService.getSessions()).toHaveLength(1);
  });
  it("round-trips exported JSON after validation", () => { const exported = storageService.exportData(); expect(validateImportedData(JSON.parse(exported))).toBe(true); expect(storageService.importData(exported).schemaVersion).toBe(2); });
  it("migrates schema version 1 data without losing sessions", () => {
    const legacy = JSON.stringify({ schemaVersion: 1, focusSessions: [], schulteResults: [], meditationSessions: [] });
    const migrated = storageService.importData(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.cognitiveResults).toEqual([]);
  });
  it("rejects malformed imports", () => expect(() => storageService.importData('{"hello":"world"}')).toThrow(/有效/));
});
