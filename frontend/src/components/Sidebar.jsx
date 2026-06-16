import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import {
  BookOpen, StickyNote, Pin, Trash2, Tag, ChevronDown, ChevronRight,
  Plus, PanelLeftClose, PanelLeftOpen, Pencil, Check, X
} from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function Sidebar({ notebooks, tags, filter, onFilterChange, onNotebooksChange, onTagsChange, isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const [notebooksOpen, setNotebooksOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const [addingNotebook, setAddingNotebook] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const totalNotes = notebooks.reduce((sum, nb) => sum + (nb._count?.notes || 0), 0);

  const saveNotebook = async () => {
    if (!newName.trim()) return;
    await api.post('/notebooks', { name: newName, color: newColor });
    setNewName(''); setNewColor(COLORS[0]); setAddingNotebook(false);
    onNotebooksChange();
  };

  const saveTag = async () => {
    if (!newName.trim()) return;
    await api.post('/tags', { name: newName, color: newColor });
    setNewName(''); setNewColor(COLORS[0]); setAddingTag(false);
    onTagsChange();
  };

  const saveEdit = async (type, id) => {
    if (!editName.trim()) return;
    if (type === 'notebook') {
      await api.put(`/notebooks/${id}`, { name: editName });
      onNotebooksChange();
    } else {
      await api.put(`/tags/${id}`, { name: editName });
      onTagsChange();
    }
    setEditingId(null);
  };

  const deleteNotebook = async (id) => {
    if (!confirm('노트북을 삭제하면 안의 노트가 노트북 없음으로 이동됩니다. 계속할까요?')) return;
    await api.delete(`/notebooks/${id}`);
    onNotebooksChange();
    if (filter.type === 'notebook' && filter.id === id) onFilterChange({ type: 'all' });
  };

  const deleteTag = async (id) => {
    await api.delete(`/tags/${id}`);
    onTagsChange();
    if (filter.type === 'tag' && filter.id === id) onFilterChange({ type: 'all' });
  };

  const navItem = (label, icon, filterObj, count) => {
    const active = filter.type === filterObj.type && filter.id === filterObj.id;
    return (
      <button
        onClick={() => onFilterChange(filterObj)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group ${
          active ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {icon}
        <span className="flex-1 text-left truncate">{label}</span>
        {count !== undefined && (
          <span className={`text-xs ${active ? 'text-indigo-500' : 'text-gray-400'}`}>{count}</span>
        )}
      </button>
    );
  };

  if (!isOpen) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">내 메모장</span>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItem('모든 노트', <StickyNote className="w-4 h-4" />, { type: 'all' }, totalNotes)}
        {navItem('고정된 노트', <Pin className="w-4 h-4" />, { type: 'pinned' })}
        {navItem('휴지통', <Trash2 className="w-4 h-4" />, { type: 'trash' })}

        {/* Notebooks */}
        <div className="pt-2">
          <button
            onClick={() => setNotebooksOpen(p => !p)}
            className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          >
            {notebooksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            노트북
            <button
              onClick={e => { e.stopPropagation(); setAddingNotebook(true); setAddingTag(false); }}
              className="ml-auto p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </button>

          {notebooksOpen && (
            <div className="mt-1 space-y-0.5">
              {addingNotebook && (
                <div className="px-2 py-1.5 space-y-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveNotebook(); if (e.key === 'Escape') setAddingNotebook(false); }}
                    placeholder="노트북 이름"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)}
                        style={{ background: c }}
                        className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={saveNotebook} className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded">추가</button>
                    <button onClick={() => setAddingNotebook(false)} className="flex-1 bg-gray-100 text-gray-600 text-xs py-1 rounded">취소</button>
                  </div>
                </div>
              )}
              {notebooks.map(nb => (
                <div key={nb.id} className="group relative">
                  {editingId === nb.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: nb.color }} />
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit('notebook', nb.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <button onClick={() => saveEdit('notebook', nb.id)} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onFilterChange({ type: 'notebook', id: nb.id })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter.type === 'notebook' && filter.id === nb.id
                          ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: nb.color }} />
                      <span className="flex-1 text-left truncate">{nb.name}</span>
                      <span className="text-xs text-gray-400">{nb._count?.notes || 0}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <span onClick={e => { e.stopPropagation(); setEditingId(nb.id); setEditName(nb.name); }}
                          className="p-0.5 rounded hover:bg-gray-200 cursor-pointer">
                          <Pencil className="w-3 h-3" />
                        </span>
                        <span onClick={e => { e.stopPropagation(); deleteNotebook(nb.id); }}
                          className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="pt-2">
          <button
            onClick={() => setTagsOpen(p => !p)}
            className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          >
            {tagsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            태그
            <button
              onClick={e => { e.stopPropagation(); setAddingTag(true); setAddingNotebook(false); }}
              className="ml-auto p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </button>

          {tagsOpen && (
            <div className="mt-1 space-y-0.5">
              {addingTag && (
                <div className="px-2 py-1.5 space-y-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveTag(); if (e.key === 'Escape') setAddingTag(false); }}
                    placeholder="태그 이름"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)}
                        style={{ background: c }}
                        className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={saveTag} className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded">추가</button>
                    <button onClick={() => setAddingTag(false)} className="flex-1 bg-gray-100 text-gray-600 text-xs py-1 rounded">취소</button>
                  </div>
                </div>
              )}
              {tags.map(tag => (
                <div key={tag.id} className="group relative">
                  {editingId === tag.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tag.color }} />
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit('tag', tag.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <button onClick={() => saveEdit('tag', tag.id)} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onFilterChange({ type: 'tag', id: tag.id })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter.type === 'tag' && filter.id === tag.id
                          ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tag.color }} />
                      <span className="flex-1 text-left truncate">{tag.name}</span>
                      <span className="text-xs text-gray-400">{tag._count?.notes || 0}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <span onClick={e => { e.stopPropagation(); setEditingId(tag.id); setEditName(tag.name); }}
                          className="p-0.5 rounded hover:bg-gray-200 cursor-pointer">
                          <Pencil className="w-3 h-3" />
                        </span>
                        <span onClick={e => { e.stopPropagation(); deleteTag(tag.id); }}
                          className="p-0.5 rounded hover:bg-red-100 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* App name footer */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">내 메모장</span>
        </div>
      </div>
    </div>
  );
}
