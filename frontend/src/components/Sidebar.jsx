import React from 'react';
import { 
  BookOpen, 
  FileText, 
  Bot, 
  Search, 
  Settings, 
  FolderKanban, 
  Sparkles, 
  Tag, 
  BrainCircuit,
  Plus
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  categories,
  selectedCategory,
  setSelectedCategory,
  onNewNote,
  onOpenSettings,
  stats
}) {
  const navItems = [
    { id: 'notes', label: 'Ghi chú & Ý tưởng', icon: BookOpen },
    { id: 'documents', label: 'Tài liệu & Tệp tin', icon: FileText },
    { id: 'chat', label: 'AI Copilot (RAG)', icon: Bot, badge: 'AI' },
    { id: 'search', label: 'Tìm kiếm ngữ nghĩa', icon: Search },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm tracking-wide">Second Brain</h1>
            <p className="text-xs text-slate-400 font-mono">Personal AI Vault</p>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo ghi chú mới</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'notes') setSelectedCategory('All');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-indigo-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PARA Method Navigation */}
      <div className="mt-4 px-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Phân loại PARA
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.2 rounded">Tiago Forte</span>
        </div>

        <div className="space-y-0.5">
          <button
            onClick={() => {
              setActiveTab('notes');
              setSelectedCategory('All');
            }}
            className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between ${
              activeTab === 'notes' && selectedCategory === 'All'
                ? 'bg-indigo-950/60 text-indigo-300 font-medium'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <span>Tất cả ghi chú</span>
          </button>

          {categories.map((cat) => {
            const isSelected = activeTab === 'notes' && selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveTab('notes');
                  setSelectedCategory(cat);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-950/60 text-indigo-300 font-medium'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="truncate">{cat}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Stats & Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        {stats && (
          <div className="mb-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Đoạn Vector RAG:</span>
              <span className="text-indigo-400 font-mono font-medium">{stats.total_chunks || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Tài liệu đã index:</span>
              <span className="text-slate-300 font-mono font-medium">{stats.total_documents || 0}</span>
            </div>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Cài đặt & API Key</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
