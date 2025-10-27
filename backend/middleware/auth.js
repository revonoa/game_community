// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: '토큰이 필요합니다.' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[AUTH] JWT_SECRET is not set');
      return res.status(500).json({ message: '서버 설정 오류' });
    }

    const decoded = jwt.verify(token, secret);

    // 토큰에 username/nickname이 포함되어 있으면 가져오고, 없으면 null 처리
    req.user = {
      id: decoded.uid,
      isAdmin: !!decoded.isAdmin,
      username: decoded.username || null,
      nickname: decoded.nickname || decoded.username || null
    };

    return next();
  } catch (err) {
    console.error('[AUTH] requireAuth error:', err?.message ?? err);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

export function requireAdmin(req, res, next) {
  try {
    // requireAuth 이후에 호출되어야 함 (req.user가 있어야 함)
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    return next();
  } catch (err) {
    console.error('[AUTH] requireAdmin error:', err?.message ?? err);
    return res.status(500).json({ message: '서버 오류' });
  }
}
