// /src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setToken } from '../lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [notice] = useState(state?.justSignedUp ? '회원가입이 완료되었습니다. 로그인해주세요.' : '');
  const [error, setError] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsApproval(false);
    setSubmitting(true);

    try {
      // 백엔드 로그인
      const { data } = await axios.post('/api/auth/login', form);
      // data: { token, user: { id, username, nickname, isApproved, isAdmin } }

      // 토큰 저장
      setToken(data.token);

      if (!data?.user?.isApproved) {
        // 승인 전: 안내만 띄우고 머무름 (글쓰기 등 제한용)
        setNeedsApproval(true);
        setSubmitting(false);
        return;
      }

      // 승인된 계정: 상단 헤더 갱신을 위해 커스텀 이벤트 + 홈 이동
      window.dispatchEvent(new CustomEvent('auth:login'));
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || '로그인 실패');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>

        {notice && (
          <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-3">
            {notice}
          </div>
        )}
        {needsApproval && (
          <div className="mb-4 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-3">
            관리자 승인이 필요합니다. 승인 완료 후 이용하실 수 있습니다.
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">아이디</label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="아이디"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>

          <div className="text-center">
            <Link to="/signup" className="text-sm text-blue-600 hover:underline">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
