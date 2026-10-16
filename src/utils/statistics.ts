import type { AppData, DailyMetric, DateRange, FocusEventType, FocusSession, SchulteResult } from "@/src/types";
import { startOfLocalDay, toLocalDateKey } from "@/src/utils/time";

export function countFocusEvents(sessions: FocusSession[], type: FocusEventType): number {
  return sessions.reduce((total, session) => total + session.events.filter((event) => event.type === type).length, 0);
}

export function calculateRate(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

export function calculatePhoneConversionRate(sessions: FocusSession[]): number {
  return calculateRate(countFocusEvents(sessions, "phone_checked"), countFocusEvents(sessions, "phone_urge"));
}

export function calculateEventsPerHour(sessions: FocusSession[], type: FocusEventType): number {
  const totalHours = sessions.reduce((sum, session) => sum + session.actualDuration / 60, 0);
  return totalHours > 0 ? countFocusEvents(sessions, type) / totalHours : 0;
}

export function rangeStart(range: DateRange, now = Date.now()): number {
  if (range === "all") return Number.NEGATIVE_INFINITY;
  return startOfLocalDay(now) - (range - 1) * 24 * 60 * 60 * 1000;
}

export function inDateRange(date: string, range: DateRange, now = Date.now()): boolean {
  return new Date(date).getTime() >= rangeStart(range, now);
}

export function filterDataByRange(data: AppData, range: DateRange, now = Date.now()): AppData {
  return {
    schemaVersion: 2,
    focusSessions: data.focusSessions.filter((item) => inDateRange(item.date, range, now)),
    schulteResults: data.schulteResults.filter((item) => inDateRange(item.date, range, now)),
    meditationSessions: data.meditationSessions.filter((item) => inDateRange(item.date, range, now)),
    cognitiveResults: data.cognitiveResults.filter((item) => inDateRange(item.date, range, now)),
  };
}

export interface AnalyticsSummary {
  totalFocusMinutes: number;
  averageSessionMinutes: number;
  distractionsPerHour: number;
  phoneUrgesPerHour: number;
  phoneConversionRate: number;
  averageCompletionRate: number;
  averageSubjectiveScore: number;
  averageSchulteTime: number;
  schulteErrorRate: number;
  meditationMinutes: number;
  stroopAccuracy: number;
  goNoGoAccuracy: number;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function summarizeData(data: AppData): AnalyticsSummary {
  const totalFocusMinutes = data.focusSessions.reduce((sum, item) => sum + item.actualDuration, 0);
  const totalSchulteClicks = data.schulteResults.length * 25 + data.schulteResults.reduce((sum, item) => sum + item.errors, 0);
  const accuracyFor = (testType: "stroop" | "go_no_go") => {
    const results = data.cognitiveResults.filter((item) => item.testType === testType);
    const total = results.reduce((sum, item) => sum + item.totalTrials, 0);
    return total ? results.reduce((sum, item) => sum + item.correctTrials, 0) / total * 100 : 0;
  };
  return {
    totalFocusMinutes,
    averageSessionMinutes: average(data.focusSessions.map((item) => item.actualDuration)),
    distractionsPerHour: calculateEventsPerHour(data.focusSessions, "distraction"),
    phoneUrgesPerHour: calculateEventsPerHour(data.focusSessions, "phone_urge"),
    phoneConversionRate: calculatePhoneConversionRate(data.focusSessions),
    averageCompletionRate: average(data.focusSessions.map((item) => item.completionRate)),
    averageSubjectiveScore: average(data.focusSessions.map((item) => item.subjectiveFocusScore)),
    averageSchulteTime: average(data.schulteResults.map((item) => item.completionTime)),
    schulteErrorRate: totalSchulteClicks
      ? (data.schulteResults.reduce((sum, item) => sum + item.errors, 0) / totalSchulteClicks) * 100
      : 0,
    meditationMinutes: data.meditationSessions.reduce((sum, item) => sum + item.actualDuration, 0),
    stroopAccuracy: accuracyFor("stroop"),
    goNoGoAccuracy: accuracyFor("go_no_go"),
  };
}

export function buildDailyMetrics(data: AppData, days: number, now = Date.now()): DailyMetric[] {
  return Array.from({ length: days }, (_, index) => {
    const timestamp = startOfLocalDay(now) - (days - index - 1) * 24 * 60 * 60 * 1000;
    const date = toLocalDateKey(timestamp);
    const focus = data.focusSessions.filter((item) => toLocalDateKey(item.date) === date);
    const schulte = data.schulteResults.filter((item) => toLocalDateKey(item.date) === date);
    const meditation = data.meditationSessions.filter((item) => toLocalDateKey(item.date) === date);
    return {
      date,
      label: `${new Date(timestamp).getMonth() + 1}/${new Date(timestamp).getDate()}`,
      focusMinutes: Number(focus.reduce((sum, item) => sum + item.actualDuration, 0).toFixed(1)),
      distractionsPerHour: Number(calculateEventsPerHour(focus, "distraction").toFixed(2)),
      phoneUrgesPerHour: Number(calculateEventsPerHour(focus, "phone_urge").toFixed(2)),
      phoneConversionRate: Number(calculatePhoneConversionRate(focus).toFixed(1)),
      schulteTime: schulte.length ? Number(average(schulte.map((item) => item.completionTime)).toFixed(2)) : null,
      meditationMinutes: Number(meditation.reduce((sum, item) => sum + item.actualDuration, 0).toFixed(1)),
    };
  });
}

export function schultePerformance(results: SchulteResult[], now = Date.now()) {
  const ordered = [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sevenDay = ordered.filter((item) => inDateRange(item.date, 7, now));
  const best = ordered.length ? [...ordered].sort((a, b) => a.errors - b.errors || a.completionTime - b.completionTime)[0] : null;
  return {
    latest: ordered[0] ?? null,
    sevenDayAverage: average(sevenDay.map((item) => item.completionTime)),
    sevenDayErrors: average(sevenDay.map((item) => item.errors)),
    best,
    trend: ordered.slice(0, 20).reverse(),
  };
}

