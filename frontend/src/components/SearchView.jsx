import React, { useState } from 'react';
import { Search, FileText, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export default function SearchView({ onSearch, onSelectNote, onAskAI }) {
  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    const data = await onSearch(query.trim(), 12, sourceType || null);
    setResults(data || []);
    setIsSearching(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header & Search Bar */}
      <div className="p-8 border-b border-slate-800 bg-slate-900/40">
        <h1 className="text-xl font-bold text-slate-100 mb-1">
          Tìm kiếm ngữ nghĩa (Semantic Search)
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Tìm kiếm thông tin theo ý nghĩa và ngữ cảnh thay vì chỉ khớp chính xác từng từ khóa.
        </p>

        <form onSubmit={handleSearch} className="max-w-3xl space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập ý tưởng, khái niệm hoặc câu hỏi cần tra cứu..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-24 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all shadow-sm"
            >
              {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 text-[11px]">Nguồn:</span>
            {['', 'note', 'document'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSourceType(type)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  sourceType === type
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                }`}
              >
                {type === '' ? 'Tất cả' : type === 'note' ? 'Chỉ Ghi chú' : 'Chỉ Tài liệu'}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results View */}
      <div className="p-8 max-w-4xl space-y-4">
        {hasSearched && results.length === 0 && !isSearching && (
          <div className="text-center py-12 text-slate-500 text-xs">
            Không tìm thấy đoạn kiến thức nào khớp với truy vấn của bạn.
          </div>
        )}

        <div className="grid gap-3">
          {results.map((r) => {
            const isNote = r.source_type === 'note';
            return (
              <div
                key={r.id}
                className="p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {isNote ? (
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="text-xs font-semibold text-slate-200">
                      {r.source_title}
                    </span>
                    {r.metadata?.header && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        &gt; {r.metadata.header}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                    Độ khớp: {Math.round(r.score * 100)}%
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3 line-clamp-3">
                  {r.content}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/50">
                  <span className="text-slate-500 font-mono text-[10px]">
                    Nguồn: {isNote ? 'Ghi chú cá nhân' : 'Tập tin tải lên'}
                  </span>

                  <div className="flex items-center space-x-2">
                    {isNote && (
                      <button
                        onClick={() => onSelectNote(r.source_id)}
                        className="text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <span>Mở ghi chú</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onAskAI(`Giải thích chi tiết về đoạn kiến thức này từ "${r.source_title}":\n\n${r.content}`)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Hỏi AI</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
