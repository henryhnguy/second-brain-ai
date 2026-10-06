import React, { useState } from 'react';
import { Search, Pin, Calendar, Tag, Plus, FileText } from 'lucide-react';
import NoteEditor from './NoteEditor';

export default function NotesView({
  notes,
  categories,
  selectedCategory,
  tags,
  activeNote,
  setActiveNote,
  onSaveNote,
  onDeleteNote,
  onNewNote,
  onAskAI
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchTag = !selectedTag || (n.tags && n.tags.includes(selectedTag));
    const matchQuery =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchTag && matchQuery;
  });

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Notes List Column */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col h-full">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">
              {selectedCategory === 'All' ? 'Tất cả ghi chú' : selectedCategory}
              <span className="ml-2 text-xs font-normal text-slate-500">({filteredNotes.length})</span>
            </h2>
            <button
              onClick={onNewNote}
              className="p-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
              title="Tạo ghi chú"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc ghi chú..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Tags filter slider */}
          {tags.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedTag('')}
                className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                  selectedTag === ''
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả tag
              </button>
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                    selectedTag === t
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              Không tìm thấy ghi chú nào phù hợp
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              const dateStr = new Date(note.updated_at).toLocaleDateString('vi-VN', {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNote(note)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {note.title || 'Ghi chú không tên'}
                    </h3>
                    {note.pinned === 1 && (
                      <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2 font-normal">
                    {note.content.replace(/[#*`>]/g, '').trim() || 'Chưa có nội dung...'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {note.category}
                    </span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <NoteEditor
        note={activeNote}
        categories={categories}
        onSave={onSaveNote}
        onDelete={onDeleteNote}
        onAskAI={onAskAI}
      />
    </div>
  );
}
