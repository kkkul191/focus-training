"use client";

import { ArrowLeft, Check, CirclePause, Clock3, Smartphone, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { COMPLETION_OPTIONS, FOCUS_DURATION_OPTIONS, PHONE_URGE_DELAY_MS } from "@/src/constants/training";
import { useTimestampTimer } from "@/src/hooks/useTimestampTimer";
import { storageService } from "@/src/services/storage";
import type { ActiveFocusSession, FocusEventType, FocusSession } from "@/src/types";
import { createId } from "@/src/utils/id";
import { formatClock } from "@/src/utils/time";

interface FinishedDraft {
  active: ActiveFocusSession;
  actualDuration: number;
  completed: boolean;
}

function FocusSetup({ onStart }: { onStart: (task: string, duration: number) => void }) {
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState("");
  const effectiveDuration = customDuration ? Number(customDuration) : duration;

  return (
    <div className="page narrow-page">
      <header className="page-header"><div><p className="eyebrow">FOCUS SESSION</p><h1>准备一段安静的时间。</h1><p className="lead">先写清楚唯一任务。训练期间，只需记录分心，再把注意力带回来。</p></div></header>
      <section className="panel setup-card">
        <label className="field-label" htmlFor="focus-task">本次任务</label>
        <textarea id="focus-task" value={task} onChange={(event) => setTask(event.target.value)} placeholder="例如：阅读 Transformer 论文第三节" rows={3} autoFocus />
        <div className="field-group">
          <span className="field-label">训练时间</span>
          <div className="duration-grid">
            {FOCUS_DURATION_OPTIONS.map((option) => <button key={option} className={!customDuration && duration === option ? "choice-chip selected" : "choice-chip"} onClick={() => { setDuration(option); setCustomDuration(""); }}>{option}<small>分钟</small></button>)}
          </div>
          <label className="custom-duration">自定义 <input type="number" min="1" max="180" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} placeholder="分钟" /></label>
        </div>
        <button className="primary-button full" disabled={!task.trim() || !Number.isFinite(effectiveDuration) || effectiveDuration < 1} onClick={() => onStart(task.trim(), effectiveDuration)}>开始训练</button>
        <p className="privacy-inline">计时基于真实时间戳，切换标签页不会让时间漂移。</p>
      </section>
    </div>
  );
}

function FocusRunner({ active, onChange, onFinish }: { active: ActiveFocusSession; onChange: (active: ActiveFocusSession) => void; onFinish: (draft: FinishedDraft) => void }) {
  const { elapsed, remaining, now } = useTimestampTimer(active.startTimestamp, active.plannedDuration);
  const [feedback, setFeedback] = useState("");
  const dueUrge = active.pendingPhoneUrges.find((urge) => !urge.resolved && urge.dueAt <= now);
  const nextUrge = active.pendingPhoneUrges.filter((urge) => !urge.resolved && urge.dueAt > now).sort((a, b) => a.dueAt - b.dueAt)[0];
  const progress = Math.min(100, (elapsed / (active.plannedDuration * 60)) * 100);

  useEffect(() => {
    if (remaining === 0 && elapsed > 0) onFinish({ active, actualDuration: elapsed / 60, completed: true });
  }, [remaining, elapsed, active, onFinish]);

  const recordEvent = (type: FocusEventType, urgeId?: string) => {
    const updated: ActiveFocusSession = {
      ...active,
      events: [...active.events, { id: createId("event"), sessionId: active.id, timestamp: new Date().toISOString(), elapsedTime: elapsed, type, urgeId }],
    };
    onChange(updated);
    return updated;
  };

  const recordDistraction = () => {
    recordEvent("distraction");
    setFeedback("已记录，继续当前任务。");
    window.setTimeout(() => setFeedback(""), 2200);
  };

  const recordPhoneUrge = () => {
    const urgeId = createId("urge");
    const withEvent = recordEvent("phone_urge", urgeId);
    onChange({ ...withEvent, pendingPhoneUrges: [...withEvent.pendingPhoneUrges, { urgeId, dueAt: Date.now() + PHONE_URGE_DELAY_MS, resolved: false }] });
    setFeedback("已记录这次冲动。先继续当前任务 2 分钟。");
    window.setTimeout(() => setFeedback(""), 3500);
  };

  const resolveUrge = (type: "phone_resisted" | "phone_still_wanted" | "phone_checked") => {
    if (!dueUrge) return;
    const withEvent = recordEvent(type, dueUrge.urgeId);
    onChange({ ...withEvent, pendingPhoneUrges: withEvent.pendingPhoneUrges.map((urge) => urge.urgeId === dueUrge.urgeId ? { ...urge, resolved: true } : urge) });
    setFeedback(type === "phone_resisted" ? "冲动已过去。继续保持当前节奏。" : "已如实记录，回到当前任务即可。");
  };

  return (
    <div className="focus-stage">
      <div className="focus-topline"><span>FOCUS</span><span>{Math.round(progress)}%</span></div>
      <div className="focus-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="focus-core">
        <p className="focus-clock">{formatClock(remaining)}</p>
        <p className="focus-task">{active.task}</p>
        {nextUrge ? <p className="delay-note"><Clock3 size={15}/> 冲动复查将在 {formatClock(Math.ceil((nextUrge.dueAt - now) / 1000))} 后出现</p> : null}
        <div className="focus-actions">
          <button className="focus-action" onClick={recordDistraction}><CirclePause/><span>我走神了</span></button>
          <button className="focus-action" onClick={recordPhoneUrge}><Smartphone/><span>我想看手机</span></button>
          <button className="text-button danger-text" onClick={() => onFinish({ active, actualDuration: elapsed / 60, completed: false })}>结束训练</button>
        </div>
        <p className={feedback ? "focus-feedback visible" : "focus-feedback"} aria-live="polite">{feedback || "占位"}</p>
      </div>
      {dueUrge ? (
        <aside className="urge-checkin" aria-live="polite">
          <p className="eyebrow">2 MIN CHECK-IN</p><h2>现在还想看手机吗？</h2><p>只需诚实记录，不做评价。</p>
          <div><button onClick={() => resolveUrge("phone_resisted")}>已经不想看了</button><button onClick={() => resolveUrge("phone_still_wanted")}>仍然想看</button><button onClick={() => resolveUrge("phone_checked")}>我已经看了</button></div>
        </aside>
      ) : null}
    </div>
  );
}

function FocusReport({ draft, onSave, onDiscard }: { draft: FinishedDraft; onSave: (session: FocusSession) => void; onDiscard: () => void }) {
  const [completionRate, setCompletionRate] = useState<0 | 25 | 50 | 75 | 100>(75);
  const [score, setScore] = useState<1 | 2 | 3 | 4 | 5>(3);
  const count = (type: FocusEventType) => draft.active.events.filter((event) => event.type === type).length;

  return (
    <div className="page narrow-page report-page">
      <header className="report-hero"><span className="completion-mark"><Check /></span><p className="eyebrow">SESSION COMPLETE</p><h1>本次训练报告</h1><p>这是一份观察记录，不是对表现的评判。</p></header>
      <section className="panel report-card">
        <div className="report-task"><span>本次任务</span><strong>{draft.active.task}</strong></div>
        <div className="report-grid"><div><span>计划时间</span><strong>{draft.active.plannedDuration} min</strong></div><div><span>实际时间</span><strong>{Math.max(0, draft.actualDuration).toFixed(1)} min</strong></div><div><span>走神</span><strong>{count("distraction")} 次</strong></div><div><span>手机冲动</span><strong>{count("phone_urge")} 次</strong></div><div><span>实际查看手机</span><strong>{count("phone_checked")} 次</strong></div></div>
        <div className="report-field"><span className="field-label">任务完成程度</span><div className="segmented">{COMPLETION_OPTIONS.map((option) => <button key={option} className={completionRate === option ? "selected" : ""} onClick={() => setCompletionRate(option)}>{option}%</button>)}</div></div>
        <div className="report-field"><span className="field-label">本次专注质量 <small>主观评分</small></span><div className="score-row">{([1, 2, 3, 4, 5] as const).map((option) => <button key={option} className={score === option ? "selected" : ""} onClick={() => setScore(option)}><span>{option}</span><small>{option === 1 ? "很散" : option === 5 ? "很稳" : ""}</small></button>)}</div></div>
        <div className="report-actions"><button className="text-button" onClick={onDiscard}><ArrowLeft size={16}/> 返回，不保存</button><button className="primary-button" onClick={() => onSave({ id: draft.active.id, date: new Date(draft.active.startTimestamp).toISOString(), task: draft.active.task, plannedDuration: draft.active.plannedDuration, actualDuration: Number(draft.actualDuration.toFixed(2)), completed: draft.completed, completionRate, subjectiveFocusScore: score, events: draft.active.events })}><Sparkles size={17}/> 保存训练记录</button></div>
      </section>
    </div>
  );
}

export function FocusPage({ onSaved }: { onSaved: () => void }) {
  const [active, setActive] = useState<ActiveFocusSession | null>(() => storageService.getActiveFocus());
  const [finished, setFinished] = useState<FinishedDraft | null>(null);

  const start = (task: string, plannedDuration: number) => {
    const session: ActiveFocusSession = { id: createId("focus"), task, plannedDuration, startTimestamp: Date.now(), events: [], pendingPhoneUrges: [] };
    storageService.saveActiveFocus(session);
    setActive(session);
  };
  const update = (session: ActiveFocusSession) => { storageService.saveActiveFocus(session); setActive(session); };
  const finish = useMemo(() => (draft: FinishedDraft) => { setFinished(draft); setActive(null); }, []);

  if (finished) return <FocusReport draft={finished} onDiscard={() => { storageService.clearActiveFocus(); setFinished(null); }} onSave={(session) => { storageService.saveSession(session); storageService.clearActiveFocus(); setFinished(null); onSaved(); }} />;
  if (active) return <FocusRunner active={active} onChange={update} onFinish={finish} />;
  return <FocusSetup onStart={start} />;
}

