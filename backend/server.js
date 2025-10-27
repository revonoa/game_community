// backend/server.js
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// 라우트는 backend/routes 폴더 안에 있다고 가정하므로 상대경로는 './routes/...'
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

import postsRoutes from './routes/posts.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/boards', postsRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend 폴더 기준으로 .env 로드 (안정성)
dotenv.config({ path: path.join(__dirname, '.env') });

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// 라우트 마운트
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
