import { describe, expect, it } from "vitest";
import type { AppData, FocusSession } from "@/src/types";
import { calculateEventsPerHour, calculatePhoneConversionRate, filterDataByRange, summarizeData } from "@/src/utils/statistics";

function session(date: string, minutes = 60): FocusSession {
  return { id: date, date, task: "test", plannedDuration: minutes, actualDuration: minutes, completed: true, completionRate: 75, subjectiveFocusScore: 4, events: [
    { id: "1", sessionId: date, timestamp: date, elapsedTime: 10, type: "distraction" },
    { id: "2", sessionId: date, timestamp: date, elapsedTime: 20, type: "distraction" },
    { id: "3", sessionId: date, timestamp: date, elapsedTime: 30, type: "phone_urge", urgeId: "u1" },
    { id: "4", sessionId: date, timestamp: date, elapsedTime: 40, type: "phone_urge", urgeId: "u2" },
    { id: "5", sessionId: date, timestamp: date, elapsedTime: 50, type: "phone_checked", urgeId: "u2" },
  ] };
}

describe("statistics", () => {
  it("calculates phone conversion rate from urges and actual checks", () => expect(calculatePhoneConversionRate([session("2026-10-16T10:00:00.000Z")])).toBe(50));
  it("normalizes distraction records by actual focus hours", () => expect(calculateEventsPerHour([session("2026-10-16T10:00:00.000Z", 30)], "distraction")).toBe(4));
  it("filters all data collections to a date range", () => {
    const data: AppData = { schemaVersion: 2, focusSessions: [session("2026-10-16T01:00:00.000Z"), session("2026-09-01T01:00:00.000Z")], schulteResults: [], meditationSessions: [], cognitiveResults: [] };
    expect(filterDataByRange(data, 7, new Date("2026-10-16T12:00:00+08:00").getTime()).focusSessions).toHaveLength(1);
  });
  it("keeps metrics explainable and independent", () => {
    const summary = summarizeData({ schemaVersion: 2, focusSessions: [session("2026-10-16T10:00:00.000Z")], schulteResults: [], meditationSessions: [], cognitiveResults: [] });
    expect(summary.totalFocusMinutes).toBe(60); expect(summary.averageCompletionRate).toBe(75); expect(summary.averageSubjectiveScore).toBe(4);
  });
});

