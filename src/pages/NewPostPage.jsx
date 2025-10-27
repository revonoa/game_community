// src/pages/NewPostPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../api';

export default function NewPostPage() {
  const { board } = useParams(); // notice | game | free
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [me, setMe] = useState(null); // { id, isAdmin, ... } or null while loading

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get('/api/auth/me'); // if no token, will 401 and go catch
        if (!mounted) return;
        setMe(data);
      } catch (err) {
        // not logged-in or error -> me stays null
        if (!mounted) return;
        setMe(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 공지사항 작성은 관리자만 가능 — 백엔드에서 최종 체크하므로 프론트는 UX 용으로만 차단
  const canWrite = () => {
    if (board === 'notice') {
      return !!me?.isAdmin;
    }
    // game/free는 로그인자면 허용 (me 존재)
    return !!me;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !body.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    if (!canWrite()) {
      setError(board === 'notice' ? '공지사항은 관리자만 작성할 수 있습니다.' : '로그인 후 작성하세요.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { title: title.trim(), body: body.trim() };
      await axios.post(`/api/boards/${board}/posts`, payload);
      // 성공하면 목록으로
      navigate(`/boards/${board}`);
    } catch (err) {
      console.error('NewPost error', err);
      const msg = err?.response?.data?.message || '서버 오류';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 로딩 중이면 간단 표시 (me 확인 중)
  if (me === null && board !== 'notice') {
    // 비관리자 게시판은 로그인 없어도 글 목록은 볼 수 있지만 글쓰기하려면 로그인 필요.
    // me === null은 아직 불러오는 중 또는 비로그인 상태.
    // 여기서는 폼을 보여주되 제출 시 다시 체크하므로 그대로 보여도 됨.
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">
        {board === 'notice' ? '공지사항 작성' : board === 'game' ? '게임게시판 글쓰기' : '자유게시판 글쓰기'}
      </h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      {board === 'notice' && me && !me.isAdmin && (
        <div className="mb-4 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-3">
          관리자만 공지사항을 작성할 수 있습니다.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full border rounded px-3 py-2 focus:outline-none"
          maxLength={200}
          required
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용을 입력하세요"
          className="w-full border rounded px-3 py-2 h-64 focus:outline-none"
          required
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
