const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../lib/db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT nb.id, nb.name, nb.color, nb.createdAt, nb.updatedAt, nb.userId,
              COUNT(CASE WHEN n.isTrashed = 0 THEN 1 END) as noteCount
            FROM "Notebook" nb
            LEFT JOIN "Note" n ON n.notebookId = nb.id
            WHERE nb.userId = ?
            GROUP BY nb.id
            ORDER BY nb.createdAt ASC`,
      args: [req.user.id],
    });
    res.json(result.rows.map(r => ({ ...r, _count: { notes: Number(r.noteCount || 0) } })));
  } catch (err) {
    console.error('[notebooks GET]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: '노트북 이름을 입력해주세요.' });
    const now = new Date().toISOString();
    const id = randomUUID();
    await db.execute({
      sql: 'INSERT INTO "Notebook" (id, name, color, createdAt, updatedAt, userId) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, name, color || '#6366f1', now, now, req.user.id],
    });
    const r = await db.execute({ sql: 'SELECT * FROM "Notebook" WHERE id = ?', args: [id] });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[notebooks POST]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const check = await db.execute({
      sql: 'SELECT id FROM "Notebook" WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id],
    });
    if (!check.rows.length) return res.status(404).json({ error: '노트북을 찾을 수 없습니다.' });
    const now = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE "Notebook" SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
      args: [req.body.name, req.body.color, now, req.params.id],
    });
    const r = await db.execute({ sql: 'SELECT * FROM "Notebook" WHERE id = ?', args: [req.params.id] });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[notebooks PUT]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const check = await db.execute({
      sql: 'SELECT id FROM "Notebook" WHERE id = ? AND userId = ?',
      args: [req.params.id, req.user.id],
    });
    if (!check.rows.length) return res.status(404).json({ error: '노트북을 찾을 수 없습니다.' });
    await db.execute({ sql: 'DELETE FROM "Notebook" WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    console.error('[notebooks DELETE]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
