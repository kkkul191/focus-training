"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/src/components/ChartCard";
import { ResponsiveContainer } from "@/src/components/ResponsiveContainer";
import { StatCard } from "@/src/components/StatCard";
import { storageService } from "@/src/services/storage";
import type { SchulteClickInterval, SchulteResult } from "@/src/types";
import { createId } from "@/src/utils/id";
import { createSchulteGrid, isExpectedSchulteClick } from "@/src/utils/schulte";
import { schultePerformance } from "@/src/utils/statistics";

interface RoundSummary { result: SchulteResult; slowest: SchulteClickInterval[] }

export function SchultePage() {
  const [grid, setGrid] = useState(() => createSchulteGrid());
  const [expected, setExpected] = useState(1);
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [intervals, setIntervals] = useState<SchulteClickInterval[]>([]);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const lastCorrectAt = useRef<number | null>(null);
  const performance = schultePerformance(storageService.getSchulteResults());

  const reset = () => {
    setGrid(createSchulteGrid()); setExpected(1); setErrors(0); setStartedAt(null); setIntervals([]); setSummary(null); lastCorrectAt.current = null;
  };

  const handleClick = (number: number) => {
    if (!isExpectedSchulteClick(expected, number)) { setErrors((value) => value + 1); return; }
    const now = performanceNow();
    const actualStart = startedAt ?? now;
    if (startedAt === null) setStartedAt(now);
    const interval = expected === 1 ? 0 : (now - (lastCorrectAt.current ?? actualStart)) / 1000;
    lastCorrectAt.current = now;
    const nextIntervals = expected === 1 ? intervals : [...intervals, { number, interval }];
    setIntervals(nextIntervals);
    if (expected === 25) {
      const result: SchulteResult = { id: createId("schulte"), date: new Date().toISOString(), completionTime: Number(((now - actualStart) / 1000).toFixed(2)), errors, clickIntervals: nextIntervals };
      storageService.saveSchulteResult(result);
      setSummary({ result, slowest: [...nextIntervals].sort((a, b) => b.interval - a.interval).slice(0, 5) });
    } else setExpected((value) => value + 1);
  };

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">VISUAL SEARCH</p><h1>舒尔特任务表现</h1><p className="lead">从 1 到 25 依次点击。第一下开始计时；错误点击会被记录。</p></div><span className="date-chip">建议每日 3 轮 · 不强制</span></header>
      <section className="schulte-layout">
        <div className="panel schulte-board-card">
          {!summary ? <><div className="schulte-status"><span>寻找</span><strong>{expected}</strong><span>{startedAt === null ? "点击 1 开始" : `错误 ${errors} 次`}</span></div><div className="schulte-grid">{grid.map((number) => <button key={number} onClick={() => handleClick(number)} aria-label={`数字 ${number}`}>{number}</button>)}</div></> : <div className="schulte-result"><span className="completion-mark"><Trophy/></span><p className="eyebrow">ROUND COMPLETE</p><h2>{summary.result.completionTime.toFixed(2)} 秒</h2><p>错误 {summary.result.errors} 次 · 平均寻找时间 {(summary.result.completionTime / 24).toFixed(2)} 秒</p><div className="slow-list"><span>最慢的 5 个转换</span>{summary.slowest.map((item) => <div key={item.number}><strong>{item.number - 1} → {item.number}</strong><span>{item.interval.toFixed(2)} 秒</span></div>)}</div><button className="primary-button" onClick={reset}><RotateCcw size={17}/> 再来一轮</button></div>}
        </div>
        <aside className="schulte-insights">
          <div className="stats-grid two"><StatCard label="最近一次" value={performance.latest ? `${performance.latest.completionTime.toFixed(2)} s` : "—"} detail={performance.latest ? `${performance.latest.errors} 次错误` : "完成一轮后显示"}/><StatCard label="7 天平均" value={performance.sevenDayAverage ? `${performance.sevenDayAverage.toFixed(2)} s` : "—"} detail={performance.sevenDayAverage ? `${performance.sevenDayErrors.toFixed(1)} 次平均错误` : "暂无数据"}/><StatCard label="个人最佳" value={performance.best ? `${performance.best.completionTime.toFixed(2)} s` : "—"} detail={performance.best ? `${performance.best.errors} 次错误` : "按错误数优先比较"}/></div>
          <ChartCard title="最近 20 次" subtitle="完成时间（秒），同时保留错误次数"><ResponsiveContainer width="100%" height="100%"><LineChart data={performance.trend.map((item, index) => ({ ...item, round: index + 1 }))}><XAxis dataKey="round" tickLine={false} axisLine={false}/><YAxis hide/><Tooltip formatter={(value, name, item) => [`${Number(value).toFixed(2)} 秒 · ${item.payload.errors} 次错误`, "完成时间"]}/><Line dataKey="completionTime" stroke="#4f7b67" strokeWidth={2} dot={{ r: 3 }}/></LineChart></ResponsiveContainer></ChartCard>
        </aside>
      </section>
    </div>
  );
}

function performanceNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

