import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Save, 
  Trash2, 
  Pin, 
  Eye, 
  Edit3, 
  Sparkles, 
  Tag as TagIcon, 
  X, 
  Check,
  SplitSquareVertical
} from 'lucide-react';

export default function NoteEditor({ 
  note, 
  categories, 
  onSave, 
  onDelete, 
  onAskAI 
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Resources');
  const [tags, setTags] = useState([]);
  const [pinned, setPinned] = useState(0);
  const [newTagInput, setNewTagInput] = useState('');
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setCategory(note.category || 'Resources');
      setTags(note.tags || []);
      setPinned(note.pinned || 0);
      setSaveSuccess(false);
    } else {
      setTitle('');
      setContent('');
      setCategory('Resources');
      setTags([]);
      setPinned(0);
    }
  }, [note]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(val)) {
        setTags([...tags, val]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    await onSave({
      id: note?.id,
      title: title.trim(),
      content,
      category,
      tags,
      pinned
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          {/* Pinned toggle */}
          <button
            onClick={() => setPinned(pinned ? 0 : 1)}
            title={pinned ? "Bỏ ghim" : "Ghim ghi chú"}
            className={`p-1.5 rounded-lg border transition-all ${
              pinned 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <Pin className={`w-4 h-4 ${pinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Category Selector */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                📁 {c}
              </option>
            ))}
          </select>

          {/* AI Quick Actions */}
          <div className="hidden md:flex items-center space-x-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => onAskAI(`Tóm tắt các ý chính của ghi chú "${title}":\n\n${content}`)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Tóm tắt</span>
            </button>
            <button
              onClick={() => onAskAI(`Dựa trên nội dung ghi chú "${title}", hãy gợi ý thêm 3 ý tưởng phát triển hoặc hành động tiếp theo:\n\n${content}`)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <span>Gợi ý mở rộng</span>
            </button>
          </div>
        </div>

        {/* View Mode & Save Actions */}
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Soạn thảo"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chia đôi màn hình"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem trước Markdown"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {note?.id && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Xóa ghi chú"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã lưu!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu ghi chú'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Title & Tag Meta Inputs */}
      <div className="px-8 pt-5 pb-2 border-b border-slate-800/40 bg-slate-950">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề ghi chú..."
          className="w-full bg-transparent text-xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none"
        />

        {/* Tags bar */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <TagIcon className="w-3.5 h-3.5 text-slate-500" />
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center space-x-1 bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-md border border-slate-700/60"
            >
              <span>#{t}</span>
              <button
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-400 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ thêm thẻ (Enter)..."
            className="bg-transparent text-[11px] text-slate-400 placeholder-slate-600 focus:outline-none w-32"
          />
        </div>
      </div>

      {/* Editor & Preview Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Edit Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`h-full p-8 overflow-y-auto ${viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'}`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Soạn thảo ghi chú với Markdown (# Tiêu đề, - Danh sách, ```code...)..."
              className="w-full h-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`h-full p-8 overflow-y-auto ${viewMode === 'split' ? 'w-1/2' : 'w-full'} prose prose-invert max-w-none`}>
            {content.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-100 pb-2 border-b border-slate-800 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-slate-200 mt-6 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium text-slate-300 mt-4 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-4 text-sm" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm mb-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm mb-4" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-400 bg-indigo-950/20 rounded-r my-4" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? (
                      <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                    ) : (
                      <code className="block bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto my-3 border border-slate-800" {...props} />
                    )
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="text-slate-600 italic text-sm">Chưa có nội dung để xem trước...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
