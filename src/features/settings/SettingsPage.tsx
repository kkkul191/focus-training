"use client";

import { Download, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { storageService } from "@/src/services/storage";

export function SettingsPage({ onDataChanged }: { onDataChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const exportData = () => {
    const blob = new Blob([storageService.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "focus-training-data.json"; anchor.click();
    URL.revokeObjectURL(url); setMessage("数据已导出。");
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try { storageService.importData(await file.text()); setMessage("导入成功，数据已通过结构校验。"); onDataChanged(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "无法导入此文件。"); }
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearData = () => {
    if (!window.confirm("确定要清除所有训练数据吗？此操作不可撤销。")) return;
    if (!window.confirm("请再次确认：所有专注、舒尔特与注意训练记录都将被删除。")) return;
    storageService.clearAllData(); setMessage("所有本地训练数据已清除。"); onDataChanged();
  };

  return <div className="page narrow-page"><header className="page-header"><div><p className="eyebrow">SETTINGS</p><h1>数据与隐私</h1><p className="lead">掌控自己的训练记录。你可以随时导出、恢复或清除数据。</p></div></header><section className="panel privacy-card"><ShieldCheck size={24}/><div><h2>仅保存在本地</h2><p>Focus Training 默认不会将训练数据上传到服务器。当前版本不包含账号、云同步、广告、分析追踪或 AI API。</p></div></section><section className="settings-list"><article className="panel setting-row"><div><h3>导出数据</h3><p>下载完整 JSON 备份，文件名为 focus-training-data.json。</p></div><button className="secondary-button" onClick={exportData}><Download size={17}/> 导出</button></article><article className="panel setting-row"><div><h3>导入数据</h3><p>仅接受结构有效的 Focus Training JSON 备份。</p></div><input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])}/><button className="secondary-button" onClick={() => inputRef.current?.click()}><Upload size={17}/> 导入</button></article><article className="panel setting-row danger-zone"><div><h3>清除所有数据</h3><p>删除本浏览器中的全部训练记录，需要两次确认。</p></div><button className="danger-button" onClick={clearData}><Trash2 size={17}/> 清除</button></article></section><p className="settings-message" aria-live="polite">{message}</p></div>;
}

