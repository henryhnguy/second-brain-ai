import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Layers,
  FileCode,
  FileType
} from 'lucide-react';

export default function DocumentsView({
  documents,
  onUpload,
  onDelete,
  onAskAI
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      await onUpload(files[i]);
    }
    setUploading(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <FileType className="w-5 h-5 text-rose-400" />;
    if (t === 'md' || t === 'markdown') return <FileCode className="w-5 h-5 text-indigo-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 bg-slate-900/40">
        <h1 className="text-xl font-bold text-slate-100 mb-1">
          Kho tài liệu & Tệp tin
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Tải lên các tài liệu PDF, Markdown hoặc Text của bạn. Hệ thống sẽ tự động trích xuất nội dung, phân đoạn (chunking), tạo vector embedding và đưa vào Second Brain để bạn hỏi đáp và tra cứu ngữ nghĩa.
        </p>
      </div>

      <div className="p-8 space-y-8 max-w-5xl">
        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".pdf,.txt,.md,.markdown,.csv,.json"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-semibold text-slate-200 mb-1">
            {uploading ? 'Đang nạp và phân tích tài liệu...' : 'Kéo thả tài liệu vào đây hoặc nhấn để chọn tệp'}
          </p>
          <p className="text-xs text-slate-500">
            Hỗ trợ định dạng PDF, Markdown (.md), Văn bản thuần (.txt)
          </p>
        </div>

        {/* Documents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Tài liệu đã lập chỉ mục ({documents.length})
            </h2>
          </div>

          {documents.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-8 text-center text-slate-500 text-xs">
              Chưa có tài liệu nào được tải lên. Hãy thử tải lên một file PDF hoặc bài báo đầu tiên!
            </div>
          ) : (
            <div className="grid gap-3">
              {documents.map((doc) => {
                const dateStr = new Date(doc.created_at).toLocaleString('vi-VN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={doc.id}
                    className="p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xs font-semibold text-slate-200 truncate">
                            {doc.filename}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {doc.file_type.toUpperCase()}
                          </span>
                        </div>

                        {doc.summary && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                            {doc.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                          <span>Dung lượng: {formatSize(doc.file_size)}</span>
                          <span className="flex items-center space-x-1 text-indigo-400">
                            <Layers className="w-3 h-3" />
                            <span>{doc.chunk_count} đoạn vector</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{dateStr}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => onAskAI(`Tóm tắt nội dung và các ý chính của tài liệu "${doc.filename}"`)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Hỏi AI về tệp này</span>
                      </button>

                      <button
                        onClick={() => onDelete(doc.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
