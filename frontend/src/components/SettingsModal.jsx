import React, { useState, useEffect } from 'react';
import { X, Key, Check, Database, Cpu, ExternalLink, ShieldCheck, Globe, Sparkles } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [activeTab, setActiveTab] = useState('gemini'); // 'gemini' or 'openrouter'
  const [llmProvider, setLlmProvider] = useState('gemini');
  
  // Gemini
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');

  // OpenRouter
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('deepseek/deepseek-chat');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setLlmProvider(settings.llm_provider || 'gemini');
      setActiveTab(settings.llm_provider || 'gemini');
      setGeminiModel(settings.gemini_model || settings.model_name || 'gemini-2.5-flash');
      
      const orModel = settings.openrouter_model || 'deepseek/deepseek-chat';
      setOpenrouterModel(orModel);
      
      const knownIds = (settings.available_models?.openrouter || []).map(m => m.id);
      if (knownIds.length > 0 && !knownIds.includes(orModel)) {
        setIsCustomModel(true);
        setCustomModelInput(orModel);
      } else {
        setIsCustomModel(false);
      }
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const finalOpenrouterModel = isCustomModel && customModelInput.trim() ? customModelInput.trim() : openrouterModel;

    await onSaveSettings({
      llm_provider: llmProvider,
      gemini_api_key: geminiApiKey ? geminiApiKey.trim() : undefined,
      openrouter_api_key: openrouterApiKey ? openrouterApiKey.trim() : undefined,
      gemini_model: geminiModel,
      openrouter_model: finalOpenrouterModel,
      model_name: geminiModel
    });

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const openrouterPresets = settings?.available_models?.openrouter || [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', desc: 'Rất thông minh & chi phí siêu rẻ' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', desc: 'Mô hình suy luận lý luận chuyên sâu' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'Khả năng viết, phân tích & code đỉnh cao' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Mã nguồn mở mạnh mẽ từ Meta' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', desc: 'Mô hình flagship đa năng từ OpenAI' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Nhanh gọn, giá rẻ từ OpenAI' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', desc: 'Đa ngôn ngữ & toán luận xuất sắc' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', desc: 'Miễn phí trên OpenRouter' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">Cài đặt AI Model & Nhà cung cấp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Switch Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'gemini'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini</span>
              {llmProvider === 'gemini' && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Mặc định
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('openrouter')}
              className={`flex items-center space-x-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'openrouter'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>OpenRouter (Claude, DeepSeek, GPT...)</span>
              {llmProvider === 'openrouter' && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Mặc định
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Active Provider Selector */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">Nhà cung cấp AI mặc định: </span>
              <span className="font-semibold text-slate-200 uppercase">
                {llmProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLlmProvider(activeTab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                llmProvider === activeTab
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {llmProvider === activeTab ? '✓ Đang là mặc định' : `Đặt ${activeTab === 'gemini' ? 'Gemini' : 'OpenRouter'} làm mặc định`}
            </button>
          </div>

          {/* Gemini Tab Settings */}
          {activeTab === 'gemini' && (
            <div className="space-y-4">
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
                    <span>Lấy key Google miễn phí</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder={
                    settings?.gemini_api_key_configured
                      ? `Đã cấu hình (${settings.gemini_api_key_masked})`
                      : 'Dán AIzaSy... vào đây'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                {settings?.gemini_api_key_configured && !geminiApiKey && (
                  <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Gemini API Key đang hoạt động.</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Mô hình Gemini
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh & Tối ưu)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tiêu chuẩn)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Suy luận sâu)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenRouter Tab Settings */}
          {activeTab === 'openrouter' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OpenRouter API Key</span>
                  </label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-0.5"
                  >
                    <span>Lấy key tại OpenRouter.ai</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <input
                  type="password"
                  value={openrouterApiKey}
                  onChange={(e) => setOpenrouterApiKey(e.target.value)}
                  placeholder={
                    settings?.openrouter_api_key_configured
                      ? `Đã cấu hình (${settings.openrouter_api_key_masked})`
                      : 'sk-or-v1-...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                {settings?.openrouter_api_key_configured && !openrouterApiKey && (
                  <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>OpenRouter API Key đang hoạt động.</span>
                  </p>
                )}
              </div>

              {/* Model Preset Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Mô hình OpenRouter phổ biến
                </label>
                <select
                  value={isCustomModel ? 'custom' : openrouterModel}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomModel(true);
                    } else {
                      setIsCustomModel(false);
                      setOpenrouterModel(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {openrouterPresets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) - {m.desc}
                    </option>
                  ))}
                  <option value="custom">✏️ Tùy chỉnh (Nhập model ID khác...)</option>
                </select>
              </div>

              {/* Custom Model ID input */}
              {isCustomModel && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <label className="text-[11px] font-medium text-slate-300">
                    Nhập Model ID OpenRouter:
                  </label>
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => setCustomModelInput(e.target.value)}
                    placeholder="ví dụ: mistralai/mistral-large, cohere/command-r..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Xem danh sách hơn 200+ mô hình tại <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-indigo-400 underline">openrouter.ai/models</a>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Database Stats */}
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
