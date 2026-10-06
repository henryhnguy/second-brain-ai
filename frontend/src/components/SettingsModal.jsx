import React, { useState, useEffect } from 'react';
import { X, Key, Check, Database, Cpu, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setModel(settings.model_name || 'gemini-2.5-flash');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveSettings({
      gemini_api_key: apiKey ? apiKey.trim() : undefined,
      model_name: model
    });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">Cài đặt AI & Hệ thống</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-0.5"
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                settings?.gemini_api_key_configured
                  ? `Đã cấu hình (${settings.gemini_api_key_masked})`
                  : 'Dán AIzaSy... vào đây'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            {settings?.gemini_api_key_configured && !apiKey && (
              <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>API Key đang hoạt động. Chỉ nhập lại nếu muốn thay đổi.</span>
              </p>
            )}
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">
              Mô hình Gemini (LLM Model)
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh & Tối ưu)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tiêu chuẩn)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Suy luận sâu)</option>
            </select>
          </div>

          {/* Knowledge Base Stats */}
          {settings?.stats && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dữ liệu Second Brain</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-base font-bold text-slate-100 font-mono">
                    {settings.stats.total_notes}
                  </div>
                  <div className="text-[10px] text-slate-400">Ghi chú</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-base font-bold text-slate-100 font-mono">
                    {settings.stats.total_documents}
                  </div>
                  <div className="text-[10px] text-slate-400">Tài liệu</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-base font-bold text-indigo-400 font-mono">
                    {settings.stats.total_chunks}
                  </div>
                  <div className="text-[10px] text-slate-400">Đoạn RAG</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end space-x-2 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã lưu!</span>
              </>
            ) : (
              <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
