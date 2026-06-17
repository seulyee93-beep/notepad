const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../lib/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT t.id, t.name, t.color, t.createdAt, t.userId,
              COUNT(nt.noteId) as noteCount
            FROM "Tag" t
            LEFT JOIN "NoteTag" nt ON t.id = nt.tagId
            WHERE t.userId = ?
            GROUP BY t.id
            ORDER BY t.name ASC`,
      args: [req.user.id],
    });
    res.json(result.rows.map(t => ({ ...t, _count: { notes: Number(t.noteCount || 0) } })));
  } catch (err) {
    console.error('[tags GET]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: '태그 이름을 입력해주세요.' });
    const now = new Date().toISOString();
    const id = randomUUID();
    await db.execute({
      sql: 'INSERT INTO "Tag" (id, name, color, createdAt, userId) VALUES (?, ?, ?, ?, ?)',
      args: [id, name, color || '#64748b', now, req.user.id],
    });
    const r = await db.execute({ sql: 'SELECT * FROM "Tag" WHERE id = ?', args: [id] });
    res.json({ ...r.rows[0], _count: { notes: 0 } });
  } catch (err) {
    console.error('[tags POST]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const check = await db.execute({
      sql: 'SELECT id FROM "Tag" WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id],
    });
    if (!check.rows.length) return res.status(404).json({ error: '태그를 찾을 수 없습니다.' });
    await db.execute({
      sql: 'UPDATE "Tag" SET name = ?, color = ? WHERE id = ?',
      args: [req.body.name, req.body.color, req.params.id],
    });
    const r = await db.execute({ sql: 'SELECT * FROM "Tag" WHERE id = ?', args: [req.params.id] });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[tags PUT]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const check = await db.execute({
      sql: 'SELECT id FROM "Tag" WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id],
    });
    if (!check.rows.length) return res.status(404).json({ error: '태그를 찾을 수 없습니다.' });
    await db.execute({ sql: 'DELETE FROM "Tag" WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    console.error('[tags DELETE]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
