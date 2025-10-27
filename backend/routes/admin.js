// backend/routes/admin.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/admin/users
 * 쿼리:
 *  - approved: 'true' | 'false' | (없으면 전체)
 *  - q: 검색어(아이디/닉네임/이메일)
 *  - limit, offset: 페이징
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { approved, q, limit = 20, offset = 0 } = req.query;

    const params = [];
    let where = 'WHERE 1=1';

    if (approved === 'true') {
      where += ' AND is_approved=1';
    } else if (approved === 'false') {
      where += ' AND is_approved=0';
    }
    if (q) {
      where += ' AND (username LIKE ? OR nickname LIKE ? OR email LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    // 주의: DB에 실제 존재하는 생성일 컬럼명에 맞춰 ORDER BY를 일관되게 사용하세요.
    // 에러 로그에 따르면 SELECT에는 create_at(언더바 하나)로 되어 있음 -> ORDER BY도 create_at으로 통일
    const sql =
      `SELECT id, username, nickname, email, is_approved, is_admin, create_at
       FROM users
       ${where}
       ORDER BY create_at DESC
       LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);

    // count (where 동일)
    const countSql = `SELECT COUNT(*) AS cnt FROM users ${where}`;
    const [cntRows] = await pool.query(countSql, params.slice(0, params.length - 2));

    res.json({ items: rows, total: cntRows[0].cnt });
  } catch (e) {
    console.error('[ADMIN users list ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

/**
 * PUT /api/admin/users/:id/approve
 * body: { approve: boolean }
 */
router.put('/users/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;
    const [r] = await pool.query('UPDATE users SET is_approved=? WHERE id=?', [approve ? 1 : 0, id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[ADMIN approve ERROR]', e);
    res.status(500).json({ message: '서버 오류' });
  }
});

export default router;
