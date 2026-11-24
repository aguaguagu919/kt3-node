/**
 * @openapi
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - authorId
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         published:
 *           type: boolean
 *         authorId:
 *           type: integer
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: Получить список постов с фильтрацией и пагинацией
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: published
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Успешно.
 *   post:
 *     summary: Создать новый пост
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - authorId
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *               authorId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nodejs", "prisma"]
 *     responses:
 *       201:
 *         description: Создано.
 * 
 * /api/posts/{id}:
 *   get:
 *     summary: Получить пост с автором и тегами
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успешно.
 *   patch:
 *     summary: Обновить пост
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               published:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Обновлено.
 *   delete:
 *     summary: Удалить пост
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Удалено.
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { validate } = require('../middleware/validate');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const { search, published, authorId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (published !== undefined) {
      where.published = published === 'true';
    }
    if (authorId) {
      where.authorId = parseInt(authorId);
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where, skip, take: limit,
        include: { author: true, tags: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where })
    ]);

    res.json({
      data: posts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: true, tags: true }
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) { next(error); }
});

router.post('/', validate('post'), async (req, res, next) => {
  try {
    const { title, content, published, authorId, tags } = req.body;

    const authorExists = await prisma.user.findUnique({ where: { id: authorId } });
    if (!authorExists) return res.status(400).json({ error: 'Author does not exist' });

    const newPost = await prisma.post.create({
      data: {
        title, content, published, authorId,
        tags: {
          connectOrCreate: tags.map(t => ({ where: { name: t }, create: { name: t } }))
        }
      },
      include: { tags: true }
    });
    res.status(201).json(newPost);
  } catch (error) { next(error); }
});

router.patch('/:id', validate('postUpdate'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, published, authorId, tags } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;
    if (authorId !== undefined) data.authorId = authorId;
    if (tags !== undefined) {
      data.tags = {
        set: [],
        connectOrCreate: tags.map(t => ({ where: { name: t }, create: { name: t } }))
      };
    }

    const updated = await prisma.post.update({ where: { id }, data, include: { tags: true } });
    res.json(updated);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.post.delete({ where: { id } });
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
