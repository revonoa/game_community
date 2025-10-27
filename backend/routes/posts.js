// backend/routes/posts.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();

// helper: allowed boards
const allowedBoards = new Set(['notice','game','free']);

// GET list
router.get('/:board/posts', async (req, res) => {
  try {
    const { board } = req.params;
    if (!allowedBoards.has(board)) return res.status(400).json({ message: 'invalid board' });

    const q = req.query.q || '';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const params = [board];
    let where = 'WHERE board=? AND is_deleted=0';

    if (q) {
      where += ' AND (title LIKE ? OR body LIKE ? OR author_name LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    // 리스트
    const listSql = `SELECT id, board, title, author_id, author_name, created_at, updated_at
                     FROM posts
                     ${where}
                     ORDER BY created_at DESC
                     LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const [rows] = await pool.query(listSql, params);

    // total
    const countSql = `SELECT COUNT(*) as cnt FROM posts ${where}`;
    const [cntRows] = await pool.query(countSql, params.slice(0, params.length - 2));

    res.json({ items: rows, total: cntRows[0].cnt, page, limit });
  } catch (e) {
    console.error('[POSTS list ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

// GET single
router.get('/:board/posts/:id', async (req, res) => {
  try {
    const { board, id } = req.params;
    if (!allowedBoards.has(board)) return res.status(400).json({ message: 'invalid board' });

    const [rows] = await pool.query(
      `SELECT id, board, title, body, author_id, author_name, created_at, updated_at FROM posts
       WHERE id=? AND board=? AND is_deleted=0 LIMIT 1`,
      [id, board]
    );
    if (!rows.length) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (e) {
    console.error('[POSTS get ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

// POST create
router.post('/:board/posts', requireAuth, async (req, res) => {
  try {
    const { board } = req.params;
    if (!allowedBoards.has(board)) return res.status(400).json({ message: 'invalid board' });

    // 공지사항은 관리자만 가능
    if (board === 'notice' && !req.user?.isAdmin) {
      return res.status(403).json({ message: '관리자만 공지 작성이 가능합니다.' });
    }

    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ message: '제목과 내용을 입력하세요.' });

    

    console.log('[DEBUG] req.user:', req.user);
    console.log('[DEBUG] author_id:', req.user?.id);
    console.log('[DEBUG] author_nickname:', req.user?.nickname);

    

    
    // const author_id = req.user?.id || null;
    const author_id = req.user?.id || null;
    // const author_name = req.user?.nickname ?? '익명';
    const author_name = req.user?.nickname || req.user?.username || null;

    // const [r] = await pool.query(
    //   `INSERT INTO posts (board, title, body, author_id, author_name) VALUES (?, ?, ?, ?, ?)`,
    //   [board, title, body, author_id, author_name]
    // );
    const [r] = await pool.query(
  `INSERT INTO posts (board, title, body, author_id, author_name) VALUES (?, ?, ?, ?, ?)`,
  [board, title, body, author_id, author_name]
);

    res.status(201).json({ ok: true, id: r.insertId });
  } catch (e) {
    console.error('[POSTS create ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

// PUT update (작성자 또는 관리자)
router.put('/:board/posts/:id', requireAuth, async (req, res) => {
  try {
    const { board, id } = req.params;
    if (!allowedBoards.has(board)) return res.status(400).json({ message: 'invalid board' });

    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ message: '제목과 내용을 입력하세요.' });

    // 확인: 작성자 또는 관리자
    const [rows] = await pool.query('SELECT author_id FROM posts WHERE id=? AND board=? LIMIT 1', [id, board]);
    if (!rows.length) return res.status(404).json({ message: '게시글이 없습니다.' });

    const author_id = rows[0].author_id;
    const isOwner = req.user?.id && author_id === req.user.id;
    if (!isOwner && !req.user?.isAdmin) return res.status(403).json({ message: '권한이 없습니다.' });

    await pool.query('UPDATE posts SET title=?, body=?, updated_at=NOW() WHERE id=?', [title, body, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[POSTS update ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

// DELETE (soft delete)
router.delete('/:board/posts/:id', requireAuth, async (req, res) => {
  try {
    const { board, id } = req.params;
    if (!allowedBoards.has(board)) return res.status(400).json({ message: 'invalid board' });

    const [rows] = await pool.query('SELECT author_id FROM posts WHERE id=? AND board=? LIMIT 1', [id, board]);
    if (!rows.length) return res.status(404).json({ message: '게시글 없음' });

    const author_id = rows[0].author_id;
    const isOwner = req.user?.id && author_id === req.user.id;
    if (!isOwner && !req.user?.isAdmin) return res.status(403).json({ message: '권한이 없습니다.' });

    await pool.query('UPDATE posts SET is_deleted=1 WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[POSTS delete ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

export default router;
