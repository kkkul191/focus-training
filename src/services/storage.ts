import type {
  ActiveFocusSession,
  AppData,
  CognitiveResult,
  FocusSession,
  MeditationSession,
  SchulteResult,
} from "@/src/types";

const DATA_KEY = "focus-training:data:v1";
const ACTIVE_FOCUS_KEY = "focus-training:active-focus:v1";
const THEME_KEY = "focus-training:theme";

const EMPTY_DATA: AppData = {
  schemaVersion: 2,
  focusSessions: [],
  schulteResults: [],
  meditationSessions: [],
  cognitiveResults: [],
};

function storageAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateImportedData(value: unknown): boolean {
  if (!isRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== 2)) return false;
  if (!Array.isArray(value.focusSessions) || !Array.isArray(value.schulteResults) || !Array.isArray(value.meditationSessions)) return false;

  const focusValid = value.focusSessions.every((item) =>
    isRecord(item) &&
    typeof item.id === "string" &&
    typeof item.date === "string" &&
    typeof item.task === "string" &&
    typeof item.plannedDuration === "number" &&
    typeof item.actualDuration === "number" &&
    typeof item.completed === "boolean" &&
    typeof item.completionRate === "number" &&
    typeof item.subjectiveFocusScore === "number" &&
    Array.isArray(item.events),
  );
  const schulteValid = value.schulteResults.every((item) =>
    isRecord(item) && typeof item.id === "string" && typeof item.date === "string" &&
    typeof item.completionTime === "number" && typeof item.errors === "number" && Array.isArray(item.clickIntervals),
  );
  const meditationValid = value.meditationSessions.every((item) =>
    isRecord(item) && typeof item.id === "string" && typeof item.date === "string" &&
    typeof item.plannedDuration === "number" && typeof item.actualDuration === "number" &&
    typeof item.mindWanderingMarks === "number",
  );
  const cognitiveValid = value.schemaVersion === 1 || (
    Array.isArray(value.cognitiveResults) && value.cognitiveResults.every((item) =>
      isRecord(item) && typeof item.id === "string" && typeof item.date === "string" &&
      (item.testType === "stroop" || item.testType === "go_no_go") &&
      typeof item.totalTrials === "number" && typeof item.correctTrials === "number" &&
      typeof item.commissionErrors === "number" && typeof item.omissionErrors === "number" &&
      typeof item.averageReactionTime === "number" && Array.isArray(item.trials),
    )
  );
  return focusValid && schulteValid && meditationValid && cognitiveValid;
}

function migrateData(value: unknown): AppData {
  const data = value as Record<string, unknown>;
  return {
    schemaVersion: 2,
    focusSessions: data.focusSessions as FocusSession[],
    schulteResults: data.schulteResults as SchulteResult[],
    meditationSessions: data.meditationSessions as MeditationSession[],
    cognitiveResults: data.schemaVersion === 2 ? data.cognitiveResults as CognitiveResult[] : [],
  };
}

function readData(): AppData {
  if (!storageAvailable()) return { ...EMPTY_DATA };
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return { ...EMPTY_DATA };
    const parsed: unknown = JSON.parse(raw);
    return validateImportedData(parsed) ? migrateData(parsed) : { ...EMPTY_DATA };
  } catch {
    return { ...EMPTY_DATA };
  }
}

function writeData(data: AppData): void {
  if (storageAvailable()) window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export const storageService = {
  getData: readData,
  getSessions: (): FocusSession[] => readData().focusSessions,
  saveSession(session: FocusSession): void {
    const data = readData();
    writeData({ ...data, focusSessions: [...data.focusSessions.filter((item) => item.id !== session.id), session] });
  },
  getSchulteResults: (): SchulteResult[] => readData().schulteResults,
  saveSchulteResult(result: SchulteResult): void {
    const data = readData();
    writeData({ ...data, schulteResults: [...data.schulteResults.filter((item) => item.id !== result.id), result] });
  },
  getMeditationSessions: (): MeditationSession[] => readData().meditationSessions,
  saveMeditationSession(session: MeditationSession): void {
    const data = readData();
    writeData({ ...data, meditationSessions: [...data.meditationSessions.filter((item) => item.id !== session.id), session] });
  },
  getCognitiveResults: (): CognitiveResult[] => readData().cognitiveResults,
  saveCognitiveResult(result: CognitiveResult): void {
    const data = readData();
    writeData({ ...data, cognitiveResults: [...data.cognitiveResults.filter((item) => item.id !== result.id), result] });
  },
  saveActiveFocus(session: ActiveFocusSession): void {
    if (storageAvailable()) window.localStorage.setItem(ACTIVE_FOCUS_KEY, JSON.stringify(session));
  },
  getActiveFocus(): ActiveFocusSession | null {
    if (!storageAvailable()) return null;
    try {
      const raw = window.localStorage.getItem(ACTIVE_FOCUS_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || typeof parsed.id !== "string" || typeof parsed.startTimestamp !== "number" || !Array.isArray(parsed.events)) return null;
      return parsed as unknown as ActiveFocusSession;
    } catch {
      return null;
    }
  },
  clearActiveFocus(): void {
    if (storageAvailable()) window.localStorage.removeItem(ACTIVE_FOCUS_KEY);
  },
  exportData(): string {
    return JSON.stringify(readData(), null, 2);
  },
  importData(raw: string): AppData {
    const parsed: unknown = JSON.parse(raw);
    if (!validateImportedData(parsed)) throw new Error("文件结构不是有效的 Focus Training 数据。请确认它来自本应用的导出文件。");
    const migrated = migrateData(parsed);
    writeData(migrated);
    return migrated;
  },
  clearAllData(): void {
    if (!storageAvailable()) return;
    window.localStorage.removeItem(DATA_KEY);
    window.localStorage.removeItem(ACTIVE_FOCUS_KEY);
  },
  getTheme(): "light" | "dark" | null {
    if (!storageAvailable()) return null;
    const theme = window.localStorage.getItem(THEME_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  },
  setTheme(theme: "light" | "dark"): void {
    if (storageAvailable()) window.localStorage.setItem(THEME_KEY, theme);
  },
};

