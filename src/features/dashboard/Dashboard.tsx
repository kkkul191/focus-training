"use client";

import { Activity, ArrowRight, Brain, Eye, Grid3X3, TimerReset } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/src/components/ChartCard";
import { ResponsiveContainer } from "@/src/components/ResponsiveContainer";
import { StatCard } from "@/src/components/StatCard";
import { storageService } from "@/src/services/storage";
import { buildDailyMetrics, calculatePhoneConversionRate, countFocusEvents } from "@/src/utils/statistics";
import { formatMinutes, toLocalDateKey } from "@/src/utils/time";
import type { PageKey } from "@/src/components/AppShell";

const chartColors = { green: "#4f7b67", sage: "#9aaf9e", sand: "#c7a66a" };

export function Dashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const [now] = useState(() => Date.now());
  const data = storageService.getData();
  const today = toLocalDateKey(now);
  const sessions = data.focusSessions.filter((item) => toLocalDateKey(item.date) === today);
  const todayMinutes = sessions.reduce((sum, item) => sum + item.actualDuration, 0);
  const trends = buildDailyMetrics(data, 7, now);

  return (
    <div className="page dashboard-page">
      <header className="page-header hero-header">
        <div>
          <p className="eyebrow">FOCUS TRAINING</p>
          <h1>把注意力，带回此刻。</h1>
          <p className="lead">记录分心，而不评判它。用可解释的数据，训练持续专注与恢复能力。</p>
        </div>
        <button className="primary-button hero-button" onClick={() => onNavigate("focus")}>
          开始专注训练 <ArrowRight size={18} />
        </button>
      </header>

      <section>
        <div className="section-heading">
          <div><p className="eyebrow">TODAY</p><h2>今日训练状态</h2></div>
          <span className="date-chip">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date())}</span>
        </div>
        <div className="stats-grid five">
          <StatCard label="有效专注时间" value={formatMinutes(todayMinutes)} detail="已保存的实际时长" />
          <StatCard label="完成训练" value={`${sessions.length} 次`} />
          <StatCard label="走神记录" value={`${countFocusEvents(sessions, "distraction")} 次`} />
          <StatCard label="手机冲动" value={`${countFocusEvents(sessions, "phone_urge")} 次`} />
          <StatCard label="实际查看" value={`${countFocusEvents(sessions, "phone_checked")} 次`} detail={`冲动转化率 ${calculatePhoneConversionRate(sessions).toFixed(0)}%`} />
        </div>
      </section>

      <section className="dashboard-split">
        <div>
          <div className="section-heading"><div><p className="eyebrow">7 DAYS</p><h2>最近趋势</h2></div></div>
          <div className="charts-grid">
            <ChartCard title="每日专注时间" subtitle="分钟">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={trends}><defs><linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors.green} stopOpacity={0.3}/><stop offset="100%" stopColor={chartColors.green} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis hide/><Tooltip/><Area type="monotone" dataKey="focusMinutes" stroke={chartColors.green} fill="url(#focusFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="走神与手机冲动" subtitle="每小时次数">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trends}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis hide/><Tooltip/><Line type="monotone" dataKey="distractionsPerHour" name="走神/小时" stroke={chartColors.sand} strokeWidth={2} dot={false}/><Line type="monotone" dataKey="phoneUrgesPerHour" name="手机冲动/小时" stroke={chartColors.sage} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
            </ChartCard>
            <ChartCard title="手机冲动转化率" subtitle="实际查看 ÷ 手机冲动">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trends}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false}/><YAxis domain={[0, 100]} hide/><Tooltip formatter={(value) => `${value}%`}/><Line type="monotone" dataKey="phoneConversionRate" stroke={chartColors.green} strokeWidth={2} dot={{ r: 3 }}/></LineChart></ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        <aside className="panel suggestion-panel">
          <p className="eyebrow">TODAY’S PRACTICE</p>
          <h2>今日建议</h2>
          <p className="muted">一组轻量组合，不需要全部完成。</p>
          <button onClick={() => onNavigate("schulte")}><Grid3X3/><span><strong>舒尔特方格</strong><small>5 分钟 · 视觉搜索</small></span><ArrowRight/></button>
          <button onClick={() => onNavigate("meditation")}><Brain/><span><strong>注意训练</strong><small>10 分钟 · 呼吸觉察</small></span><ArrowRight/></button>
          <button onClick={() => onNavigate("cognitive")}><Activity/><span><strong>认知控制</strong><small>Stroop / Go-No-Go</small></span><ArrowRight/></button>
          <button onClick={() => onNavigate("focus")}><TimerReset/><span><strong>专注学习</strong><small>30 分钟 · 持续注意</small></span><ArrowRight/></button>
          <div className="quiet-note"><Eye size={17}/><span>看见走神，本身就是注意力恢复的开始。</span></div>
        </aside>
      </section>
    </div>
  );
}

