import React, { useState, useEffect } from 'react';
import { api } from './api';
import Sidebar from './components/Sidebar';
import NotesView from './components/NotesView';
import DocumentsView from './components/DocumentsView';
import ChatView from './components/ChatView';
import SearchView from './components/SearchView';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [categories, setCategories] = useState(['Projects', 'Areas', 'Resources', 'Archives']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tags, setTags] = useState([]);

  // Documents
  const [documents, setDocuments] = useState([]);

  // Chat
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatPromptPending, setChatPromptPending] = useState('');

  // Settings
  const [settings, setSettings] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [notesData, catsData, tagsData, docsData, sessionsData, settingsData] = await Promise.all([
        api.getNotes(),
        api.getCategories(),
        api.getTags(),
        api.getDocuments(),
        api.getSessions(),
        api.getSettings()
      ]);

      setNotes(notesData || []);
      if (notesData && notesData.length > 0) {
        setActiveNote(notesData[0]);
      }
      setCategories(catsData || ['Projects', 'Areas', 'Resources', 'Archives']);
      setTags(tagsData || []);
      setDocuments(docsData || []);
      setSessions(sessionsData || []);
      if (sessionsData && sessionsData.length > 0) {
        setCurrentSessionId(sessionsData[0].id);
      }
      setSettings(settingsData);
    } catch (err) {
      console.error('Lỗi tải dữ liệu ban đầu:', err);
    }
  };

  // Reload notes & stats
  const refreshNotes = async () => {
    const updatedNotes = await api.getNotes();
    setNotes(updatedNotes || []);
    const updatedTags = await api.getTags();
    setTags(updatedTags || []);
    const updatedSettings = await api.getSettings();
    setSettings(updatedSettings);
  };

  // Reload documents
  const refreshDocs = async () => {
    const updatedDocs = await api.getDocuments();
    setDocuments(updatedDocs || []);
    const updatedSettings = await api.getSettings();
    setSettings(updatedSettings);
  };

  // Note Handlers
  const handleSaveNote = async (noteData) => {
    let saved;
    if (noteData.id) {
      saved = await api.updateNote(noteData.id, noteData);
      setNotes(notes.map((n) => (n.id === saved.id ? saved : n)));
    } else {
      saved = await api.createNote(noteData);
      setNotes([saved, ...notes]);
    }
    setActiveNote(saved);
    refreshNotes();
  };

  const handleDeleteNote = async (id) => {
    await api.deleteNote(id);
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    setActiveNote(remaining.length > 0 ? remaining[0] : null);
    refreshNotes();
  };

  const handleNewNote = () => {
    setActiveTab('notes');
    const newNote = {
      id: null,
      title: '',
      content: '',
      category: selectedCategory === 'All' ? 'Resources' : selectedCategory,
      tags: [],
      pinned: 0
    };
    setActiveNote(newNote);
  };

  // Document Handlers
  const handleUploadDoc = async (file) => {
    await api.uploadDocument(file);
    await refreshDocs();
  };

  const handleDeleteDoc = async (id) => {
    await api.deleteDocument(id);
    await refreshDocs();
  };

  // Chat Handlers
  useEffect(() => {
    if (currentSessionId) {
      api.getMessages(currentSessionId).then((data) => {
        setMessages(data || []);
      });
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const handleCreateSession = async () => {
    const newSess = await api.createSession('Hội thoại mới');
    setSessions([newSess, ...sessions]);
    setCurrentSessionId(newSess.id);
  };

  const handleDeleteSession = async (id) => {
    await api.deleteSession(id);
    const rem = sessions.filter((s) => s.id !== id);
    setSessions(rem);
    if (currentSessionId === id) {
      setCurrentSessionId(rem.length > 0 ? rem[0].id : null);
    }
  };

  const handleSendMessage = async (text) => {
    setIsChatLoading(true);
    // Optimistic UI for user message
    const tempUserMsg = {
      id: Date.now(),
      session_id: currentSessionId,
      role: 'user',
      content: text,
      sources: [],
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const resp = await api.askQuery(currentSessionId, text);
      if (!currentSessionId && resp.session_id) {
        setCurrentSessionId(resp.session_id);
        const updatedSessions = await api.getSessions();
        setSessions(updatedSessions);
      }
      const assistantMsg = {
        id: resp.assistant_message_id,
        session_id: resp.session_id,
        role: 'assistant',
        content: resp.answer,
        sources: resp.sources,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Lỗi truy vấn AI:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Switch to Chat with a pre-filled prompt
  const handleAskAIWithPrompt = (prompt) => {
    setActiveTab('chat');
    setChatPromptPending(prompt);
    handleSendMessage(prompt);
  };

  // Search Note Selection
  const handleSelectNoteFromSearch = (noteId) => {
    const found = notes.find((n) => n.id === noteId);
    if (found) {
      setActiveNote(found);
      setActiveTab('notes');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onNewNote={handleNewNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        stats={settings?.stats}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'notes' && (
          <NotesView
            notes={notes}
            categories={categories}
            selectedCategory={selectedCategory}
            tags={tags}
            activeNote={activeNote}
            setActiveNote={setActiveNote}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onNewNote={handleNewNote}
            onAskAI={handleAskAIWithPrompt}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onUpload={handleUploadDoc}
            onDelete={handleDeleteDoc}
            onAskAI={handleAskAIWithPrompt}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            sessions={sessions}
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            initialPrompt={chatPromptPending}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            onSearch={api.search}
            onSelectNote={handleSelectNoteFromSearch}
            onAskAI={handleAskAIWithPrompt}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (data) => {
          await api.updateSettings(data);
          const s = await api.getSettings();
          setSettings(s);
        }}
      />
    </div>
  );
}
