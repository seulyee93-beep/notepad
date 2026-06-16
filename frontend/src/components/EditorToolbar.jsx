import {
  Bold, Italic, Underline, Strikethrough, Code, Highlighter,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Minus, Link, Undo, Redo
} from 'lucide-react';

const Btn = ({ onClick, active, title, children }) => (
  <button
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    title={title}
    className={`p-1.5 rounded transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1" />;

export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL 입력:', editor.getAttributes('link').href);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-6 py-2 border-b border-gray-100 bg-gray-50">
      <Btn onClick={() => editor.chain().focus().undo().run()} title="실행 취소"><Undo className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="다시 실행"><Redo className="w-4 h-4" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게"><Bold className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><Italic className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄"><Underline className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><Strikethrough className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="형광펜"><Highlighter className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="코드"><Code className="w-4 h-4" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목1"><Heading1 className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목2"><Heading2 className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목3"><Heading3 className="w-4 h-4" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호"><List className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록"><ListOrdered className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="체크리스트"><CheckSquare className="w-4 h-4" /></Btn>
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용"><Quote className="w-4 h-4" /></Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선"><Minus className="w-4 h-4" /></Btn>
      <Btn onClick={setLink} active={editor.isActive('link')} title="링크"><Link className="w-4 h-4" /></Btn>
    </div>
  );
}
