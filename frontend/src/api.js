const API_BASE = '/api';

export const api = {
  // Notes
  getNotes: async (category = '', tag = '', q = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (tag) params.append('tag', tag);
    if (q) params.append('q', q);
    const res = await fetch(`${API_BASE}/notes?${params.toString()}`);
    return res.json();
  },
  getNote: async (id) => {
    const res = await fetch(`${API_BASE}/notes/${id}`);
    return res.json();
  },
  createNote: async (note) => {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    return res.json();
  },
  updateNote: async (id, note) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    return res.json();
  },
  deleteNote: async (id) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    return res.json();
  },
  getCategories: async () => {
    const res = await fetch(`${API_BASE}/notes/meta/categories`);
    return res.json();
  },
  getTags: async () => {
    const res = await fetch(`${API_BASE}/notes/meta/tags`);
    return res.json();
  },

  // Documents
  getDocuments: async () => {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
  },
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  deleteDocument: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Chat & RAG
  getSessions: async () => {
    const res = await fetch(`${API_BASE}/chat/sessions`);
    return res.json();
  },
  createSession: async (title = 'Hội thoại mới') => {
    const res = await fetch(`${API_BASE}/chat/sessions?title=${encodeURIComponent(title)}`, {
      method: 'POST'
    });
    return res.json();
  },
  deleteSession: async (id) => {
    const res = await fetch(`${API_BASE}/chat/sessions/${id}`, { method: 'DELETE' });
    return res.json();
  },
  getMessages: async (sessionId) => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`);
    return res.json();
  },
  askQuery: async (sessionId, question, provider = null, model = null) => {
    const payload = { session_id: sessionId, question };
    if (provider) payload.provider = provider;
    if (model) payload.model = model;
    const res = await fetch(`${API_BASE}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Search
  search: async (q, limit = 10, sourceType = null) => {
    const params = new URLSearchParams({ q, limit });
    if (sourceType) params.append('source_type', sourceType);
    const res = await fetch(`${API_BASE}/search?${params.toString()}`);
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
