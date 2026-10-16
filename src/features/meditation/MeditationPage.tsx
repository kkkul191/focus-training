"use client";

import { Check, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { MEDITATION_DURATION_OPTIONS } from "@/src/constants/training";
import { useTimestampTimer } from "@/src/hooks/useTimestampTimer";
import { storageService } from "@/src/services/storage";
import { createId } from "@/src/utils/id";
import { formatClock } from "@/src/utils/time";

export function MeditationPage({ onSaved }: { onSaved: () => void }) {
  const [duration, setDuration] = useState(10);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [marks, setMarks] = useState(0);
  const [complete, setComplete] = useState(false);
  const { remaining, elapsed } = useTimestampTimer(startTimestamp, duration);

  useEffect(() => {
    if (startTimestamp !== null && remaining === 0 && elapsed > 0 && !complete) {
      const completion = window.setTimeout(() => {
        storageService.saveMeditationSession({ id: createId("meditation"), date: new Date(startTimestamp).toISOString(), plannedDuration: duration, actualDuration: elapsed / 60, mindWanderingMarks: marks });
        setComplete(true); onSaved();
      }, 0);
      return () => window.clearTimeout(completion);
    }
  }, [remaining, elapsed, complete, duration, marks, startTimestamp, onSaved]);

  if (complete) return <div className="page narrow-page"><div className="panel meditation-complete"><span className="completion-mark"><Check/></span><p className="eyebrow">ATTENTION PRACTICE</p><h1>练习完成</h1><p>本次 {duration} 分钟，共记录 {marks} 次注意变化。</p><p className="muted">次数不是好坏评分。记录变多，也可能意味着你更快觉察到了走神。</p><button className="primary-button" onClick={() => { setComplete(false); setStartTimestamp(null); setMarks(0); }}><RotateCcw size={17}/> 再练一次</button></div></div>;

  if (startTimestamp !== null) return <div className="meditation-stage" onClick={() => setMarks((value) => value + 1)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") setMarks((value) => value + 1); }}><p className="eyebrow">ATTENTION</p><p className="meditation-clock">{formatClock(remaining)}</p><div className="breath-orb" aria-hidden="true"><span/></div><h1>把注意力放在呼吸上。</h1><p>发现自己走神时，点击屏幕，然后重新关注呼吸。</p><span className="marks-counter">已记录 {marks} 次</span></div>;

  return <div className="page narrow-page"><header className="page-header"><div><p className="eyebrow">MEDITATION / ATTENTION</p><h1>练习觉察，再温和地回来。</h1><p className="lead">这里不判断走神次数。每一次点击，代表你觉察到了注意力变化。</p></div></header><section className="panel setup-card meditation-setup"><span className="field-label">练习时间</span><div className="duration-grid three">{MEDITATION_DURATION_OPTIONS.map((option) => <button key={option} className={duration === option ? "choice-chip selected" : "choice-chip"} onClick={() => setDuration(option)}>{option}<small>分钟</small></button>)}</div><div className="breathing-copy"><div className="mini-orb"/><p>找一个舒适姿势。将视线放松，注意呼吸自然进出。</p></div><button className="primary-button full" onClick={() => setStartTimestamp(Date.now())}><Play size={17}/> 开始注意训练</button></section></div>;
}

