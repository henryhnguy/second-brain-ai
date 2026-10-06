import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  Trash2, 
  FileText, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  BrainCircuit, 
  CornerDownLeft,
  Globe,
  Settings,
  Cpu
} from 'lucide-react';

export default function ChatView({
  sessions,
  currentSessionId,
  setCurrentSessionId,
  onCreateSession,
  onDeleteSession,
  messages,
  onSendMessage,
  isLoading,
  initialPrompt,
  settings,
  onOpenSettings
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Active Provider & Model selection inside Chat
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  useEffect(() => {
    if (settings) {
      const prov = settings.llm_provider || 'gemini';
      setSelectedProvider(prov);
      if (prov === 'openrouter') {
        setSelectedModel(settings.openrouter_model || 'deepseek/deepseek-chat');
      } else {
        setSelectedModel(settings.gemini_model || settings.model_name || 'gemini-2.5-flash');
      }
    }
  }, [settings]);

  useEffect(() => {
    if (initialPrompt) {
      setInputMessage(initialPrompt);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    const msg = inputMessage;
    setInputMessage('');
    onSendMessage(msg, selectedProvider, selectedModel);
  };

  const toggleSource = (msgIndex, srcIndex) => {
    const key = `${msgIndex}_${srcIndex}`;
    setExpandedSources((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const starterPrompts = [
    "🧠 Trong Second Brain của tôi hiện đang lưu những nội dung gì?",
    "📚 Tóm tắt nguyên lý hoạt động của phương pháp PARA",
    "💡 Tuyển tập các kỹ thuật prompt AI hiệu quả nhất",
    "🎯 Những việc tôi cần ưu tiên thực hiện cho dự án của mình là gì?"
  ];

  const geminiModels = settings?.available_models?.gemini || [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ];

  const openrouterModels = settings?.available_models?.openrouter || [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' }
  ];

  return (
    <div className="flex-1 flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Session List Left Column */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/40 flex flex-col h-full">
        <div className="p-3.5 border-b border-slate-800">
          <button
            onClick={onCreateSession}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700/60 transition-all text-slate-200 text-xs font-semibold rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8">
              Chưa có phiên chat nào
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-950/50 text-indigo-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate flex-1">{s.title || 'Hội thoại mới'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-opacity"
                    title="Xóa cuộc trò chuyện"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full bg-slate-950">
        {/* Top Control Bar with Model Switcher */}
        <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">
              RAG Copilot
            </span>
          </div>

          {/* Model Switcher Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1">
              {selectedProvider === 'openrouter' ? (
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              )}

              <select
                value={`${selectedProvider}::${selectedModel}`}
                onChange={(e) => {
                  const [prov, mod] = e.target.value.split('::');
                  setSelectedProvider(prov);
                  setSelectedModel(mod);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <optgroup label="⚡ Google Gemini">
                  {geminiModels.map((m) => (
                    <option key={`gemini::${m.id}`} value={`gemini::${m.id}`} className="bg-slate-900 text-slate-100">
                      Gemini - {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 OpenRouter Models">
                  {openrouterModels.map((m) => (
                    <option key={`openrouter::${m.id}`} value={`openrouter::${m.id}`} className="bg-slate-900 text-slate-100">
                      OpenRouter - {m.name}
                    </option>
                  ))}
                  {settings?.openrouter_model && !openrouterModels.some(m => m.id === settings.openrouter_model) && (
                    <option value={`openrouter::${settings.openrouter_model}`} className="bg-slate-900 text-slate-100">
                      OpenRouter - {settings.openrouter_model} (Tùy chỉnh)
                    </option>
                  )}
                </optgroup>
              </select>
            </div>

            <button
              onClick={onOpenSettings}
              title="Cài đặt API Key & Model"
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <BrainCircuit className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-100 mb-1">
                  Trợ lý AI Second Brain
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Đang sử dụng mô hình <strong className="text-indigo-400">{selectedModel}</strong> ({selectedProvider === 'openrouter' ? 'OpenRouter' : 'Google Gemini'}).
                  Hệ thống sẽ tra cứu toàn bộ ghi chú và tài liệu cá nhân để trả lời chính xác nhất:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {starterPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(p, selectedProvider, selectedModel)}
                    className="p-3 text-left rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, mIdx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || mIdx}
                  className={`flex gap-3 max-w-3xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert max-w-none text-xs">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-base font-bold text-slate-100 my-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-sm font-semibold text-slate-200 my-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-xs font-semibold text-slate-300 my-1" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-2 text-slate-300" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-2 text-slate-300" {...props} />,
                              code: ({node, inline, ...props}) => 
                                inline ? (
                                  <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-[11px] font-mono" {...props} />
                                ) : (
                                  <code className="block bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-300 overflow-x-auto my-2 border border-slate-800" {...props} />
                                ),
                              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-indigo-500 pl-3 py-0.5 italic text-slate-400 bg-indigo-950/20 rounded-r my-2 text-[11px]" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Citations & Sources Accordion */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Nguồn trích dẫn ({msg.sources.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => {
                            const isExpanded = expandedSources[`${mIdx}_${sIdx}`];
                            const isDoc = src.source_type === 'document';
                            return (
                              <div
                                key={sIdx}
                                className="bg-slate-900 border border-slate-800/90 rounded-lg text-[11px] overflow-hidden transition-all max-w-md"
                              >
                                <button
                                  onClick={() => toggleSource(mIdx, sIdx)}
                                  className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors w-full text-left"
                                >
                                  {isDoc ? <FileText className="w-3 h-3 text-rose-400 shrink-0" /> : <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />}
                                  <span className="truncate max-w-[180px] font-medium">{src.title}</span>
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                    {Math.round(src.score * 100)}%
                                  </span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                                </button>

                                {isExpanded && (
                                  <div className="p-2.5 bg-slate-950/70 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                                    {src.snippet}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl mx-auto justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                <span>Second Brain đang tra cứu ({selectedModel})...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Field */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={2}
              placeholder={`Đặt câu hỏi với ${selectedModel} (Enter để gửi)...`}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-3 bottom-4 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/20"
              title="Gửi câu hỏi"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
