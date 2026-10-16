export type FocusEventType =
  | "distraction"
  | "phone_urge"
  | "phone_resisted"
  | "phone_still_wanted"
  | "phone_checked";

export interface FocusEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  elapsedTime: number;
  type: FocusEventType;
  urgeId?: string;
}

export interface FocusSession {
  id: string;
  date: string;
  task: string;
  plannedDuration: number;
  actualDuration: number;
  completed: boolean;
  completionRate: 0 | 25 | 50 | 75 | 100;
  subjectiveFocusScore: 1 | 2 | 3 | 4 | 5;
  events: FocusEvent[];
}

export interface PendingPhoneUrge {
  urgeId: string;
  dueAt: number;
  resolved: boolean;
}

export interface ActiveFocusSession {
  id: string;
  task: string;
  plannedDuration: number;
  startTimestamp: number;
  events: FocusEvent[];
  pendingPhoneUrges: PendingPhoneUrge[];
}

export interface SchulteClickInterval {
  number: number;
  interval: number;
}

export interface SchulteResult {
  id: string;
  date: string;
  completionTime: number;
  errors: number;
  clickIntervals: SchulteClickInterval[];
}

export interface MeditationSession {
  id: string;
  date: string;
  plannedDuration: number;
  actualDuration: number;
  mindWanderingMarks: number;
}

export type CognitiveTestType = "stroop" | "go_no_go";

export interface CognitiveTrial {
  index: number;
  stimulus: string;
  expectedResponse: string;
  response: string | null;
  correct: boolean;
  reactionTime: number | null;
}

export interface CognitiveResult {
  id: string;
  date: string;
  testType: CognitiveTestType;
  totalTrials: number;
  correctTrials: number;
  commissionErrors: number;
  omissionErrors: number;
  averageReactionTime: number;
  trials: CognitiveTrial[];
}

export interface AppData {
  schemaVersion: 2;
  focusSessions: FocusSession[];
  schulteResults: SchulteResult[];
  meditationSessions: MeditationSession[];
  cognitiveResults: CognitiveResult[];
}

export type DateRange = 7 | 28 | "all";

export interface DailyMetric {
  date: string;
  label: string;
  focusMinutes: number;
  distractionsPerHour: number;
  phoneUrgesPerHour: number;
  phoneConversionRate: number;
  schulteTime: number | null;
  meditationMinutes: number;
}

