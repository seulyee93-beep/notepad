import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Search, Pin, StickyNote } from 'lucide-react';

const filterLabels = { all: '모든 노트', pinned: '고정된 노트', trash: '휴지통', notebook: '노트북', tag: '태그' };

export default function NoteList({ notes, selectedNote, onSelect, onCreate, search, onSearch, filter }) {
  const stripHtml = html => html?.replace(/<[^>]*>/g, '').trim() || '';

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">{filterLabels[filter.type] || '노트'}</h2>
          {filter.type !== 'trash' && (
            <button onClick={onCreate}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title="새 노트">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="검색..."
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <StickyNote className="w-10 h-10 opacity-30" />
            <p className="text-sm">노트가 없습니다</p>
            {filter.type !== 'trash' && (
              <button onClick={onCreate} className="text-xs text-indigo-500 hover:underline">
                첫 노트 만들기
              </button>
            )}
          </div>
        ) : (
          notes.map(note => (
            <button
              key={note.id}
              onClick={() => onSelect(note)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                selectedNote?.id === note.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-900 text-sm truncate flex-1">
                  {note.title || '제목 없음'}
                </h3>
                {note.isPinned && <Pin className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                {stripHtml(note.content) || '내용 없음'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-gray-300">
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: ko })}
                </span>
                {note.notebook && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: note.notebook.color }}>
                    {note.notebook.name}
                  </span>
                )}
              </div>
              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {note.tags.slice(0, 3).map(({ tag }) => (
                    <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
