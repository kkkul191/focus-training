"use client";

import { ArrowLeft, Circle, Play, RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatCard } from "@/src/components/StatCard";
import { storageService } from "@/src/services/storage";
import type { CognitiveResult, CognitiveTrial } from "@/src/types";
import { createId } from "@/src/utils/id";
import {
  generateGoNoGoSequence,
  generateStroopSequence,
  isStroopResponseCorrect,
  scoreGoNoGo,
  STROOP_COLORS,
  type GoNoGoStimulus,
  type StroopColor,
  type StroopStimulus,
} from "@/src/utils/cognitive";

const colorLabels: Record<StroopColor, string> = { red: "红", blue: "蓝", green: "绿", amber: "黄" };
const STROOP_TRIALS = 24;
const GO_NO_GO_TRIALS = 40;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function averageReactionTime(trials: CognitiveTrial[]): number {
  const values = trials.flatMap((trial) => trial.reactionTime === null ? [] : [trial.reactionTime]);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function createResult(testType: "stroop" | "go_no_go", trials: CognitiveTrial[]): CognitiveResult {
  return {
    id: createId(testType),
    date: new Date().toISOString(),
    testType,
    totalTrials: trials.length,
    correctTrials: trials.filter((trial) => trial.correct).length,
    commissionErrors: trials.filter((trial) => !trial.correct && trial.response !== null).length,
    omissionErrors: trials.filter((trial) => !trial.correct && trial.response === null).length,
    averageReactionTime: Number(averageReactionTime(trials).toFixed(1)),
    trials,
  };
}

function TrainingSummary({ result, onRestart, onExit }: { result: CognitiveResult; onRestart: () => void; onExit: () => void }) {
  const accuracy = result.totalTrials ? result.correctTrials / result.totalTrials * 100 : 0;
  return <div className="cognitive-summary panel"><span className="completion-mark"><ShieldCheck/></span><p className="eyebrow">ROUND COMPLETE</p><h2>{result.testType === "stroop" ? "Stroop 训练完成" : "Go / No-Go 训练完成"}</h2><div className="stats-grid two"><StatCard label="正确率" value={`${accuracy.toFixed(1)}%`} detail={`${result.correctTrials} / ${result.totalTrials} 题`}/><StatCard label="平均反应时" value={result.averageReactionTime ? `${Math.round(result.averageReactionTime)} ms` : "—"} detail="仅统计已作答刺激"/><StatCard label="误按" value={`${result.commissionErrors} 次`} detail={result.testType === "go_no_go" ? "No-Go 时作答" : "选择了错误颜色"}/><StatCard label="漏按" value={`${result.omissionErrors} 次`} detail={result.testType === "go_no_go" ? "Go 时未作答" : "本训练不设超时"}/></div><p className="quiet-explanation">正确率和反应时应一起观察。更快不一定更好，单次结果也不代表稳定能力。</p><div className="report-actions"><button className="text-button" onClick={onExit}><ArrowLeft size={16}/> 返回训练选择</button><button className="primary-button" onClick={onRestart}><RotateCcw size={17}/> 再练一轮</button></div></div>;
}

function StroopTraining({ onExit, onSaved }: { onExit: () => void; onSaved: () => void }) {
  const [sequence, setSequence] = useState<StroopStimulus[]>([]);
  const [index, setIndex] = useState(0);
  const [trials, setTrials] = useState<CognitiveTrial[]>([]);
  const [summary, setSummary] = useState<CognitiveResult | null>(null);
  const startedAt = useRef(0);
  const current = sequence[index];

  const start = () => {
    setSequence(generateStroopSequence(STROOP_TRIALS)); setIndex(0); setTrials([]); setSummary(null); startedAt.current = now();
  };

  const respond = (response: StroopColor) => {
    if (!current) return;
    const trial: CognitiveTrial = { index, stimulus: `${current.word}:${current.ink}`, expectedResponse: current.ink, response, correct: isStroopResponseCorrect(current, response), reactionTime: Math.round(now() - startedAt.current) };
    const nextTrials = [...trials, trial];
    setTrials(nextTrials);
    if (index === sequence.length - 1) {
      const result = createResult("stroop", nextTrials); storageService.saveCognitiveResult(result); setSummary(result); onSaved();
    } else { setIndex((value) => value + 1); startedAt.current = now(); }
  };

  if (summary) return <TrainingSummary result={summary} onRestart={start} onExit={onExit}/>;
  if (!current) return <div className="panel cognitive-intro"><button className="text-button" onClick={onExit}><ArrowLeft size={16}/> 返回</button><p className="eyebrow">STROOP TEST</p><h2>选择文字的颜色，不要读文字。</h2><p>屏幕会显示一个颜色词。请忽略词义，点击它实际呈现的墨水颜色。</p><div className="example-stroop stroop-blue">红</div><p className="example-caption">示例：这里应选择“蓝”</p><button className="primary-button" onClick={start}><Play size={17}/> 开始 {STROOP_TRIALS} 题</button></div>;

  return <div className="cognitive-stage"><div className="cognitive-progress"><span>STROOP</span><span>{index + 1} / {sequence.length}</span></div><div className={`stroop-word stroop-${current.ink}`}>{colorLabels[current.word]}</div><p>请选择文字本身的颜色</p><div className="stroop-options">{STROOP_COLORS.map((color) => <button key={color} onClick={() => respond(color)}><span className={`color-dot stroop-bg-${color}`}/>{colorLabels[color]}</button>)}</div><button className="text-button" onClick={onExit}>退出本轮</button></div>;
}

function GoNoGoTraining({ onExit, onSaved }: { onExit: () => void; onSaved: () => void }) {
  const [sequence, setSequence] = useState<GoNoGoStimulus[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "cue" | "gap" | "done">("idle");
  const [trials, setTrials] = useState<CognitiveTrial[]>([]);
  const [summary, setSummary] = useState<CognitiveResult | null>(null);
  const startedAt = useRef(0);
  const responded = useRef(false);
  const current = sequence[index];

  const complete = useCallback((nextTrials: CognitiveTrial[]) => {
    const result = createResult("go_no_go", nextTrials); storageService.saveCognitiveResult(result); setSummary(result); setPhase("done"); onSaved();
  }, [onSaved]);

  const finishTrial = useCallback((didRespond: boolean) => {
    if (phase !== "cue" || responded.current || !current) return;
    responded.current = true;
    const score = scoreGoNoGo(current, didRespond);
    const trial: CognitiveTrial = { index, stimulus: current, expectedResponse: current === "go" ? "respond" : "withhold", response: didRespond ? "respond" : null, correct: score.correct, reactionTime: didRespond ? Math.round(now() - startedAt.current) : null };
    const nextTrials = [...trials, trial]; setTrials(nextTrials);
    if (index === sequence.length - 1) complete(nextTrials); else setPhase("gap");
  }, [complete, current, index, phase, sequence.length, trials]);

  useEffect(() => {
    if (phase !== "cue") return;
    responded.current = false; startedAt.current = now();
    const timer = window.setTimeout(() => finishTrial(false), 900);
    return () => window.clearTimeout(timer);
  }, [finishTrial, phase]);

  useEffect(() => {
    if (phase !== "gap") return;
    const timer = window.setTimeout(() => { setIndex((value) => value + 1); setPhase("cue"); }, 350);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "cue") return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.code === "Space") { event.preventDefault(); finishTrial(true); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishTrial, phase]);

  const start = () => { setSequence(generateGoNoGoSequence(GO_NO_GO_TRIALS)); setIndex(0); setTrials([]); setSummary(null); setPhase("cue"); };

  if (summary) return <TrainingSummary result={summary} onRestart={start} onExit={onExit}/>;
  if (phase === "idle") return <div className="panel cognitive-intro"><button className="text-button" onClick={onExit}><ArrowLeft size={16}/> 返回</button><p className="eyebrow">GO / NO-GO</p><h2>该按时按，该停时停。</h2><p>看到绿色圆形时按空格或点击；看到带横线的暖色圆形时不要操作。刺激出现 0.9 秒。</p><div className="go-examples"><span><i className="go-cue"/>Go · 作答</span><span><i className="no-go-cue">—</i>No-Go · 不作答</span></div><button className="primary-button" onClick={start}><Play size={17}/> 开始 {GO_NO_GO_TRIALS} 题</button></div>;

  return <div className="cognitive-stage go-stage" onClick={() => finishTrial(true)} role="button" tabIndex={0} aria-label="Go 刺激时点击此区域作答"><div className="cognitive-progress"><span>GO / NO-GO</span><span>{index + 1} / {sequence.length}</span></div><div className="go-cue-wrap">{phase === "cue" ? current === "go" ? <span className="go-cue large"/> : <span className="no-go-cue large">—</span> : <span className="gap-mark">+</span>}</div><p>{phase === "cue" && current === "go" ? "按空格 / 点击" : ""}</p><span className="keyboard-hint">SPACE</span></div>;
}

export function CognitivePage() {
  const [mode, setMode] = useState<"stroop" | "go_no_go" | null>(null);
  const [, setRevision] = useState(0);
  const saved = useCallback(() => setRevision((value) => value + 1), []);
  if (mode === "stroop") return <div className="page narrow-page"><StroopTraining onExit={() => setMode(null)} onSaved={saved}/></div>;
  if (mode === "go_no_go") return <div className="page narrow-page"><GoNoGoTraining onExit={() => setMode(null)} onSaved={saved}/></div>;

  const results = storageService.getCognitiveResults();
  const latest = (type: "stroop" | "go_no_go") => [...results].filter((item) => item.testType === type).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const stroop = latest("stroop"); const goNoGo = latest("go_no_go");
  return <div className="page"><header className="page-header"><div><p className="eyebrow">COGNITIVE CONTROL</p><h1>训练选择与抑制。</h1><p className="lead">两项短训练分别观察干扰抑制与反应控制。结果只描述任务表现，不推断整体注意力水平。</p></div></header><section className="training-module-grid"><article className="panel training-module"><div className="module-icon"><Zap/></div><p className="eyebrow">STROOP</p><h2>颜色干扰训练</h2><p>忽略词义，选择实际墨水颜色。记录正确率和正确作答反应时。</p><div className="module-latest"><span>最近一次</span><strong>{stroop ? `${(stroop.correctTrials / stroop.totalTrials * 100).toFixed(0)}% · ${Math.round(stroop.averageReactionTime)} ms` : "暂无记录"}</strong></div><button className="primary-button" onClick={() => setMode("stroop")}>开始 Stroop</button></article><article className="panel training-module"><div className="module-icon"><Circle/></div><p className="eyebrow">GO / NO-GO</p><h2>反应抑制训练</h2><p>对 Go 刺激快速作答，对 No-Go 刺激保持不动。分开记录误按与漏按。</p><div className="module-latest"><span>最近一次</span><strong>{goNoGo ? `${(goNoGo.correctTrials / goNoGo.totalTrials * 100).toFixed(0)}% · ${Math.round(goNoGo.averageReactionTime)} ms` : "暂无记录"}</strong></div><button className="primary-button" onClick={() => setMode("go_no_go")}>开始 Go / No-Go</button></article></section><p className="module-note">建议在精神状态相近时比较多次结果；不要用一次成绩给自己贴标签。</p></div>;
}
