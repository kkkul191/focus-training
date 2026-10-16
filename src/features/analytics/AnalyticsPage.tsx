"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/src/components/ChartCard";
import { ResponsiveContainer } from "@/src/components/ResponsiveContainer";
import { StatCard } from "@/src/components/StatCard";
import { storageService } from "@/src/services/storage";
import type { DateRange } from "@/src/types";
import { buildDailyMetrics, filterDataByRange, summarizeData } from "@/src/utils/statistics";
import { formatMinutes } from "@/src/utils/time";

const ranges: Array<{ value: DateRange; label: string }> = [{ value: 7, label: "7 天" }, { value: 28, label: "28 天" }, { value: "all", label: "全部" }];

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>(7);
  const [now] = useState(() => Date.now());
  const allData = storageService.getData();
  const filtered = useMemo(() => filterDataByRange(allData, range, now), [allData, range, now]);
  const summary = useMemo(() => summarizeData(filtered), [filtered]);
  const days = range === "all" ? Math.max(28, Math.ceil((now - Math.min(...allData.focusSessions.map((item) => new Date(item.date).getTime()), now)) / 86400000) + 1) : range;
  const trend = buildDailyMetrics(allData, Math.min(days, 90), now);

  const metrics = [
    ["总专注时间", formatMinutes(summary.totalFocusMinutes), "实际保存时长"],
    ["平均单次专注", formatMinutes(summary.averageSessionMinutes), `${filtered.focusSessions.length} 次训练`],
    ["每小时走神", `${summary.distractionsPerHour.toFixed(2)} 次`, "走神记录 ÷ 专注小时"],
    ["每小时手机冲动", `${summary.phoneUrgesPerHour.toFixed(2)} 次`, "手机冲动 ÷ 专注小时"],
    ["冲动→实际查看", `${summary.phoneConversionRate.toFixed(1)}%`, "实际查看 ÷ 手机冲动"],
    ["任务平均完成率", `${summary.averageCompletionRate.toFixed(1)}%`, "结束时自评"],
    ["主观专注质量", summary.averageSubjectiveScore ? `${summary.averageSubjectiveScore.toFixed(1)} / 5` : "—", "主观评分均值"],
    ["舒尔特平均用时", summary.averageSchulteTime ? `${summary.averageSchulteTime.toFixed(2)} s` : "—", `${filtered.schulteResults.length} 轮`],
    ["舒尔特错误率", `${summary.schulteErrorRate.toFixed(1)}%`, "错误点击 ÷ 全部点击"],
    ["注意训练", formatMinutes(summary.meditationMinutes), "范围内累计"],
    ["Stroop 正确率", summary.stroopAccuracy ? `${summary.stroopAccuracy.toFixed(1)}%` : "—", "颜色选择任务"],
    ["Go/No-Go 正确率", summary.goNoGoAccuracy ? `${summary.goNoGoAccuracy.toFixed(1)}%` : "—", "反应与抑制任务"],
  ];

  return <div className="page"><header className="page-header analytics-header"><div><p className="eyebrow">ANALYTICS</p><h1>看见注意力的变化。</h1><p className="lead">只呈现原始、可解释的数据；没有合成的“专注力指数”。</p></div><div className="range-switch">{ranges.map((item) => <button key={item.label} className={range === item.value ? "active" : ""} onClick={() => setRange(item.value)}>{item.label}</button>)}</div></header><section className="stats-grid five analytics-stats">{metrics.map(([label, value, detail]) => <StatCard key={label} label={label} value={value} detail={detail}/>)}</section><section className="charts-grid analytics-charts"><ChartCard title="每日专注时间" subtitle="分钟"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis hide/><Tooltip/><Area dataKey="focusMinutes" stroke="#4f7b67" fill="#4f7b6722" strokeWidth={2}/></AreaChart></ResponsiveContainer></ChartCard><ChartCard title="每小时走神次数" subtitle="按当日专注时长标准化"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis hide/><Tooltip/><Line dataKey="distractionsPerHour" stroke="#c7a66a" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></ChartCard><ChartCard title="手机查看转化率" subtitle="实际查看 ÷ 手机冲动"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis domain={[0, 100]} hide/><Tooltip formatter={(value) => `${value}%`}/><Line dataKey="phoneConversionRate" stroke="#8a9f92" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></ChartCard><ChartCard title="舒尔特完成时间" subtitle="当天平均秒数"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis hide/><Tooltip/><Line connectNulls dataKey="schulteTime" stroke="#4f7b67" strokeWidth={2} dot={{ r: 3 }}/></LineChart></ResponsiveContainer></ChartCard></section></div>;
}

