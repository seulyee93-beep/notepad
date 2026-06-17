const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../lib/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

async function fetchNoteWithRelations(noteId) {
  const noteResult = await db.execute({
    sql: `SELECT n.id, n.title, n.content, n.isPinned, n.isTrashed, n.createdAt, n.updatedAt, n.userId, n.notebookId,
            nb.name as notebookName, nb.color as notebookColor
          FROM "Note" n LEFT JOIN "Notebook" nb ON n.notebookId = nb.id
          WHERE n.id = ?`,
    args: [noteId],
  });
  const n = noteResult.rows[0];
  if (!n) return null;

  const tagsResult = await db.execute({
    sql: `SELECT t.id, t.name, t.color FROM "NoteTag" nt JOIN "Tag" t ON nt.tagId = t.id WHERE nt.noteId = ?`,
    args: [noteId],
  });

  return {
    id: n.id, title: n.title, content: n.content,
    isPinned: n.isPinned === 1, isTrashed: n.isTrashed === 1,
    createdAt: n.createdAt, updatedAt: n.updatedAt,
    userId: n.userId, notebookId: n.notebookId,
    notebook: n.notebookId ? { id: n.notebookId, name: n.notebookName, color: n.notebookColor } : null,
    tags: tagsResult.rows.map(t => ({ tag: { id: t.id, name: t.name, color: t.color } })),
  };
}

router.get('/', async (req, res) => {
  try {
    const { notebookId, tagId, search, trashed, pinned } = req.query;

    let sql = `SELECT n.id, n.title, n.content, n.isPinned, n.isTrashed, n.createdAt, n.updatedAt, n.userId, n.notebookId,
                 nb.name as notebookName, nb.color as notebookColor
               FROM "Note" n LEFT JOIN "Notebook" nb ON n.notebookId = nb.id`;
    if (tagId) sql += ` INNER JOIN "NoteTag" nt ON n.id = nt.noteId AND nt.tagId = ?`;
    sql += ` WHERE n.userId = ? AND n.isTrashed = ?`;

    const args = [];
    if (tagId) args.push(tagId);
    args.push(req.user.id, trashed === 'true' ? 1 : 0);

    if (notebookId) { sql += ` AND n.notebookId = ?`; args.push(notebookId); }
    if (pinned === 'true') sql += ` AND n.isPinned = 1`;
    if (search) {
      sql += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY n.isPinned DESC, n.updatedAt DESC`;

    const notesResult = await db.execute({ sql, args });
    const notes = notesResult.rows;
    if (!notes.length) return res.json([]);

    const noteIds = notes.map(n => n.id);
    const tagsResult = await db.execute({
      sql: `SELECT nt.noteId, t.id as tagId, t.name, t.color FROM "NoteTag" nt JOIN "Tag" t ON nt.tagId = t.id WHERE nt.noteId IN (${noteIds.map(() => '?').join(',')})`,
      args: noteIds,
    });

    const tagsByNote = {};
    for (const row of tagsResult.rows) {
      if (!tagsByNote[row.noteId]) tagsByNote[row.noteId] = [];
      tagsByNote[row.noteId].push({ tag: { id: row.tagId, name: row.name, color: row.color } });
    }

    res.json(notes.map(n => ({
      id: n.id, title: n.title, content: n.content,
      isPinned: n.isPinned === 1, isTrashed: n.isTrashed === 1,
      createdAt: n.createdAt, updatedAt: n.updatedAt,
      userId: n.userId, notebookId: n.notebookId,
      notebook: n.notebookId ? { id: n.notebookId, name: n.notebookName, color: n.notebookColor } : null,
      tags: tagsByNote[n.id] || [],
    })));
  } catch (err) {
    console.error('[notes GET]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, notebookId, tagIds } = req.body;
    const now = new Date().toISOString();
    const id = randomUUID();

    await db.execute({
      sql: 'INSERT INTO "Note" (id, title, content, isPinned, isTrashed, createdAt, updatedAt, userId, notebookId) VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?)',
      args: [id, title || '제목 없음', content || '', now, now, req.user.id, notebookId || null],
    });

    if (tagIds && tagIds.length) {
      for (const tagId of tagIds) {
        await db.execute({
          sql: 'INSERT INTO "NoteTag" (noteId, tagId) VALUES (?, ?)',
          args: [id, tagId],
        });
      }
    }

    res.json(await fetchNoteWithRelations(id));
  } catch (err) {
    console.error('[notes POST]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const check = await db.execute({
      sql: 'SELECT id FROM "Note" WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id],
    });
    if (!check.rows.length) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });

    const { title, content, notebookId, isPinned, isTrashed, tagIds } = req.body;
    const now = new Date().toISOString();
    const sets = ['updatedAt = ?'];
    const args = [now];

    if (title !== undefined) { sets.push('title = ?'); args.push(title); }
    if (content !== undefined) { sets.push('content = ?'); args.push(content); }
    if (notebookId !== undefined) { sets.push('notebookId = ?'); args.push(notebookId); }
    if (isPinned !== undefined) { sets.push('isPinned = ?'); args.push(isPinned ? 1 : 0); }
    if (isTrashed !== undefined) { sets.push('isTrashed = ?'); args.push(isTrashed ? 1 : 0); }
    args.push(req.params.id);

    await db.execute({ sql: `UPDATE "Note" SET ${sets.join(', ')} WHERE id = ?`, args });

    if (tagIds !== undefined) {
      await db.execute({ sql: 'DELETE FROM "NoteTag" WHERE noteId = ?', args: [req.params.id] });
      for (const tagId of tagIds) {
        await db.execute({
          sql: 'INSERT INTO "NoteTag" (noteId, tagId) VALUES (?, ?)',
          args: [req.params.id, tagId],
        });
      }
    }

    res.json(await fetchNoteWithRelations(req.params.id));
  } catch (err) {
    console.error('[notes PUT]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const check = await db.execute({
      sql: 'SELECT id FROM "Note" WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id],
    });
    if (!check.rows.length) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });

    await db.execute({ sql: 'DELETE FROM "Note" WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    console.error('[notes DELETE]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
