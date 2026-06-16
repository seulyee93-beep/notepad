import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import api from '../api';
import EditorToolbar from './EditorToolbar';
import {
  Pin, Trash2, RotateCcw, BookOpen, Tag as TagIcon, ChevronDown,
  StickyNote, MoreHorizontal, Trash
} from 'lucide-react';

export default function NoteEditor({ note, notebooks, tags, onUpdate, onDelete, onTagsChange, isTrash }) {
  const [title, setTitle] = useState('');
  const [notebookId, setNotebookId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [showNotebookMenu, setShowNotebookMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!note) return;
      scheduleSave({ content: editor.getHTML() });
    },
  });

  useEffect(() => {
    if (!note) return;
    setTitle(note.title === '제목 없음' ? '' : note.title);
    setNotebookId(note.notebookId || '');
    setSelectedTagIds(note.tags?.map(t => t.tagId) || []);
    editor?.commands.setContent(note.content || '', false);
  }, [note?.id]);

  const scheduleSave = useCallback((data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await onUpdate(note.id, data);
      setSaving(false);
    }, 800);
  }, [note?.id, onUpdate]);

  const handleTitleChange = (val) => {
    setTitle(val);
    scheduleSave({ title: val || '제목 없음' });
  };

  const handleNotebookChange = async (id) => {
    setNotebookId(id);
    setShowNotebookMenu(false);
    await onUpdate(note.id, { notebookId: id || null });
  };

  const toggleTag = async (tagId) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(next);
    await onUpdate(note.id, { tagIds: next });
  };

  const handlePin = () => onUpdate(note.id, { isPinned: !note.isPinned });
  const handleTrash = () => onUpdate(note.id, { isTrashed: true });
  const handleRestore = () => onUpdate(note.id, { isTrashed: false });
  const handlePermanentDelete = () => {
    if (confirm('영구 삭제하면 복구할 수 없습니다. 삭제할까요?')) onDelete(note.id);
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-3">
        <StickyNote className="w-16 h-16 opacity-30" />
        <p className="text-gray-400">노트를 선택하거나 새로 만드세요</p>
      </div>
    );
  }

  const selectedNotebook = notebooks.find(nb => nb.id === notebookId);
  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{format(new Date(note.updatedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
          {saving && <span className="text-indigo-400">저장 중...</span>}
        </div>
        <div className="flex items-center gap-1">
          {!isTrash ? (
            <>
              <button onClick={handlePin}
                className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}
                title={note.isPinned ? '고정 해제' : '고정'}>
                <Pin className="w-4 h-4" />
              </button>
              <button onClick={handleTrash}
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="휴지통으로">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> 복원
              </button>
              <button onClick={handlePermanentDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                <Trash className="w-3.5 h-3.5" /> 영구 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-50 text-xs">
        {/* Notebook selector */}
        <div className="relative">
          <button
            onClick={() => { setShowNotebookMenu(p => !p); setShowTagMenu(false); }}
            disabled={isTrash}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {selectedNotebook
              ? <span style={{ color: selectedNotebook.color }}>{selectedNotebook.name}</span>
              : <span>노트북 선택</span>
            }
            <ChevronDown className="w-3 h-3" />
          </button>
          {showNotebookMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 w-48">
              <button onClick={() => handleNotebookChange('')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-500">
                노트북 없음
              </button>
              {notebooks.map(nb => (
                <button key={nb.id} onClick={() => handleNotebookChange(nb.id)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${notebookId === nb.id ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
                  <div className="w-2 h-2 rounded-full" style={{ background: nb.color }} />
                  {nb.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="relative">
          <button
            onClick={() => { setShowTagMenu(p => !p); setShowNotebookMenu(false); }}
            disabled={isTrash}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <TagIcon className="w-3.5 h-3.5" />
            {selectedTags.length > 0
              ? <span>{selectedTags.map(t => t.name).join(', ')}</span>
              : <span>태그 추가</span>
            }
            <ChevronDown className="w-3 h-3" />
          </button>
          {showTagMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 w-48">
              {tags.length === 0
                ? <p className="px-3 py-2 text-xs text-gray-400">태그가 없습니다</p>
                : tags.map(tag => (
                  <button key={tag.id} onClick={() => toggleTag(tag.id)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${selectedTagIds.includes(tag.id) ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
                    <TagIcon className="w-3 h-3" style={{ color: tag.color }} />
                    {tag.name}
                    {selectedTagIds.includes(tag.id) && <span className="ml-auto">✓</span>}
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="px-8 pt-6 pb-2">
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="제목"
          disabled={isTrash}
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent"
        />
      </div>

      {/* Toolbar */}
      {!isTrash && editor && <EditorToolbar editor={editor} />}

      {/* Editor */}
      <div
        className="flex-1 overflow-y-auto px-8 py-4"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {/* Overlays */}
      {(showNotebookMenu || showTagMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotebookMenu(false); setShowTagMenu(false); }} />
      )}
    </div>
  );
}
