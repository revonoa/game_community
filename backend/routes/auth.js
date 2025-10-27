// backend/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';               // <-- 경로: routes/에서 한 단계 위의 db.js
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, nickname, password, email } = req.body;
    if (!username || !nickname || !password || !email) {
      return res.status(400).json({ message: '필수 항목을 입력해주세요' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: '아이디는 3~30자로 입력해주세요' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다' });
    }

    const [dup] = await pool.query(
      `SELECT id FROM users WHERE username=? OR email=? LIMIT 1`,
      [username, email]
    );
    if (dup.length) {
      return res.status(409).json({ message: '이미 사용중인 아이디/메일입니다' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (username, nickname, password_hash, email) VALUES(?,?,?,?)`,
      [username, nickname, hash, email]
    );
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      `SELECT id, username, nickname, password_hash, email, is_approved, is_admin FROM users WHERE username=? LIMIT 1`,
      [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: '아이디 또는 비밀번호가 틀렸습니다' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: '서버 설정 오류' });
    }

//     const token = jwt.sign(
//   { uid: user.id, isAdmin: !!user.is_admin, username: user.username, nickname: user.nickname },
//   secret,
//   { expiresIn: '7d' }
// );
const token = jwt.sign(
  {
    uid: user.id,
    isAdmin: !!user.is_admin,
    username: user.username,   
    nickname: user.nickname    
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        isApproved: !!user.is_approved,
        isAdmin: !!user.is_admin
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 현재 로그인한 사용자 정보(토큰 필요)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, nickname, email, is_approved, is_admin FROM users WHERE id=? LIMIT 1`,
      [req.user.id]
    );
    const me = rows[0];
    if (!me) return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });

    res.json({
      id: me.id,
      username: me.username,
      nickname: me.nickname,
      email: me.email,
      isApproved: !!me.is_approved,
      isAdmin: !!me.is_admin
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '서버 오류' });
  }
});

export default router;
