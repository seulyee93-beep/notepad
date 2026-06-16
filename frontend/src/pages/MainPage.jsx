import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import api from '../api';

export default function MainPage() {
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [filter, setFilter] = useState({ type: 'all' }); // type: all | notebook | tag | pinned | trash
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchNotebooks = useCallback(async () => {
    const res = await api.get('/notebooks');
    setNotebooks(res.data);
  }, []);

  const fetchTags = useCallback(async () => {
    const res = await api.get('/tags');
    setTags(res.data);
  }, []);

  const fetchNotes = useCallback(async () => {
    const params = {};
    if (filter.type === 'notebook') params.notebookId = filter.id;
    if (filter.type === 'tag') params.tagId = filter.id;
    if (filter.type === 'pinned') params.pinned = true;
    if (filter.type === 'trash') params.trashed = true;
    if (search) params.search = search;

    const res = await api.get('/notes', { params });
    setNotes(res.data);
    if (selectedNote && !res.data.find(n => n.id === selectedNote.id)) {
      setSelectedNote(res.data[0] || null);
    }
  }, [filter, search, selectedNote]);

  useEffect(() => { fetchNotebooks(); fetchTags(); }, [fetchNotebooks, fetchTags]);
  useEffect(() => { fetchNotes(); }, [filter, search]);

  const createNote = async () => {
    const notebookId = filter.type === 'notebook' ? filter.id : notebooks[0]?.id;
    const res = await api.post('/notes', { notebookId });
    await fetchNotes();
    setSelectedNote(res.data);
  };

  const updateNote = async (id, data) => {
    const res = await api.put(`/notes/${id}`, data);
    setNotes(prev => prev.map(n => n.id === id ? res.data : n));
    if (selectedNote?.id === id) setSelectedNote(res.data);
    fetchNotebooks();
    fetchTags();
  };

  const deleteNote = async (id) => {
    await api.delete(`/notes/${id}`);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(notes.find(n => n.id !== id) || null);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        notebooks={notebooks}
        tags={tags}
        filter={filter}
        onFilterChange={f => { setFilter(f); setSelectedNote(null); }}
        onNotebooksChange={fetchNotebooks}
        onTagsChange={fetchTags}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
      />
      <NoteList
        notes={notes}
        selectedNote={selectedNote}
        onSelect={setSelectedNote}
        onCreate={createNote}
        search={search}
        onSearch={setSearch}
        filter={filter}
      />
      <NoteEditor
        note={selectedNote}
        notebooks={notebooks}
        tags={tags}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onTagsChange={fetchTags}
        isTrash={filter.type === 'trash'}
      />
    </div>
  );
}
