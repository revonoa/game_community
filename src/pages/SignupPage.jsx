// /src/pages/SignupPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    nickname: '',
    password: '',
    email: '',
  });
  const [error, setError] = useState('');

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/auth/register', form); // 백엔드 라우트
      // 성공 시 로그인 페이지로 이동
      navigate('/login', { state: { justSignedUp: true } });
    } catch (err) {
      setError(err?.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">아이디</label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="아이디"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">닉네임</label>
            <input
              name="nickname"
              value={form.nickname}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="닉네임"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="비밀번호"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}
