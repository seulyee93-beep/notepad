const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const { notebookId, tagId, search, trashed, pinned } = req.query;

  const where = { userId: req.user.id, isTrashed: trashed === 'true' };

  if (notebookId) where.notebookId = notebookId;
  if (pinned === 'true') where.isPinned = true;
  if (tagId) where.tags = { some: { tagId } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    include: {
      notebook: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  });
  res.json(notes);
});

router.post('/', async (req, res) => {
  const { title, content, notebookId, tagIds } = req.body;

  const note = await prisma.note.create({
    data: {
      title: title || '제목 없음',
      content: content || '',
      userId: req.user.id,
      notebookId: notebookId || null,
      tags: tagIds?.length ? { create: tagIds.map(tagId => ({ tagId })) } : undefined,
    },
    include: {
      notebook: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
  });
  res.json(note);
});

router.put('/:id', async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!note) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });

  const { title, content, notebookId, isPinned, isTrashed, tagIds } = req.body;

  const data = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (notebookId !== undefined) data.notebookId = notebookId;
  if (isPinned !== undefined) data.isPinned = isPinned;
  if (isTrashed !== undefined) data.isTrashed = isTrashed;

  if (tagIds !== undefined) {
    await prisma.noteTag.deleteMany({ where: { noteId: req.params.id } });
    if (tagIds.length > 0) {
      data.tags = { create: tagIds.map(tagId => ({ tagId })) };
    }
  }

  const updated = await prisma.note.update({
    where: { id: req.params.id },
    data,
    include: {
      notebook: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!note) return res.status(404).json({ error: '노트를 찾을 수 없습니다.' });

  await prisma.note.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
