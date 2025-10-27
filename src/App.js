// src/App.js
import React, { useEffect, useState } from 'react';
import { FileText, Gamepad2, MessageSquare, ShieldCheck } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import axios from './api';
import RequireAdmin from './components/RequireAdmin';
import AdminUsersPage from './pages/AdminUsersPage';
import BoardListPage from './pages/BoardListPage';
import PostViewPage from './pages/PostViewPage';
import NewPostPage from './pages/NewPostPage';

const getToken = () => localStorage.getItem('token');
const clearToken = () => localStorage.removeItem('token');

const sampleNotices = [ /* ... same sample data ... */ ];
const sampleGamePosts = [ /* ... */ ];
const sampleFreePosts = [ /* ... */ ];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchMe = async () => {
      if (!getToken()) {
        if (!mounted) return;
        setIsAdmin(false);
        setIsLoggedIn(false);
        return;
      }
      try {
        const { data } = await axios.get('/api/auth/me');
        if (!mounted) return;
        setIsAdmin(!!data?.isAdmin);
        setIsLoggedIn(true);
      } catch (err) {
        if (!mounted) return;
        setIsAdmin(false);
        setIsLoggedIn(false);
        clearToken();
      }
    };

    fetchMe();

    const onStorage = (e) => {
      if (e.key === 'token') {
        const has = !!e.newValue;
        setIsLoggedIn(has);
        if (has) fetchMe();
        else setIsAdmin(false);
      }
    };
    const onLogin = () => { setIsLoggedIn(true); fetchMe(); };
    const onLogout = () => { setIsLoggedIn(false); setIsAdmin(false); };

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);

    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setIsAdmin(false);
    window.dispatchEvent(new CustomEvent('auth:logout'));
    window.location.href = '/';
  };

  const Header = () => {
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const adminMenuRef = React.useRef(null);

    useEffect(() => {
      function onDocClick(e) {
        if (!adminMenuRef.current) return;
        if (!adminMenuRef.current.contains(e.target)) setAdminMenuOpen(false);
      }
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold"><Link to="/" className="hover:text-blue-200">게임커뮤니티</Link></h1>
          <div className="flex gap-3 items-center">
            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button onClick={() => setAdminMenuOpen(s => !s)} className="p-2 rounded-md hover:bg-blue-500">
                  <ShieldCheck size={18} />
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg z-50">
                    <Link to="/admin/users" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setAdminMenuOpen(false)}>회원 승인 관리</Link>
                  </div>
                )}
              </div>
            )}
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="px-4 py-2 bg-white text-blue-600 rounded">로그인</Link>
                <Link to="/signup" className="px-4 py-2 bg-blue-700 text-white rounded">회원가입</Link>
              </>
            ) : (
              <button onClick={handleLogout} className="px-4 py-2 bg-blue-700 text-white rounded">로그아웃</button>
            )}
          </div>
        </div>
      </header>
    );
  };

  // App.js 내부 - Navigation 컴포넌트 (이걸 기존 Navigation 함수와 교체)
const Navigation = () => {
  const baseBtn =
    'flex items-center gap-2 px-4 py-2 rounded transition text-gray-700 hover:bg-gray-200';
  const activeBtn = 'bg-blue-600 text-white';

  return (
    <nav className="bg-gray-100 border-b border-gray-300">
      <div className="container mx-auto px-4">
        <ul className="flex gap-8 py-3">
          <li>
            <NavLink
              to="/boards/notice"
              className={({ isActive }) => (isActive ? `${baseBtn} ${activeBtn}` : baseBtn)}
            >
              <FileText size={18} />
              공지사항
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/boards/game"
              className={({ isActive }) => (isActive ? `${baseBtn} ${activeBtn}` : baseBtn)}
            >
              <Gamepad2 size={18} />
              게임게시판
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/boards/free"
              className={({ isActive }) => (isActive ? `${baseBtn} ${activeBtn}` : baseBtn)}
            >
              <MessageSquare size={18} />
              자유게시판
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};




  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notice" element={<HomePage />} />
          <Route path="/game" element={<HomePage />} />
          <Route path="/free" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
          <Route path="/boards/:board" element={<BoardListPage />} />
          <Route path="/boards/:board/posts/:id" element={<PostViewPage />} />
          <Route path="/boards/:board/new" element={<NewPostPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function HomePage() {
  const [noticeItems, setNoticeItems] = React.useState([]);
  const [gameItems, setGameItems] = React.useState([]);
  const [freeItems, setFreeItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [nRes, gRes, fRes] = await Promise.all([
          axios.get('/api/boards/notice/posts', { params: { limit: 3, page: 1 } }),
          axios.get('/api/boards/game/posts', { params: { limit: 3, page: 1 } }),
          axios.get('/api/boards/free/posts', { params: { limit: 3, page: 1 } }),
        ]);
        if (!mounted) return;
        setNoticeItems(nRes.data.items || []);
        setGameItems(gRes.data.items || []);
        setFreeItems(fRes.data.items || []);
      } catch (err) {
        console.error('HomePage load error', err);
        if (!mounted) return;
        setError(err?.response?.data?.message || '데이터를 불러오지 못했습니다.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const BoardPanel = ({ title, boardKey, items }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Link to={`/boards/${boardKey}`} className="text-sm text-blue-600 hover:underline">더보기</Link>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">게시물이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="py-1">
              <Link to={`/boards/${boardKey}/posts/${it.id}`} className="text-sm text-gray-800 hover:text-blue-600">
                {it.title}
              </Link>
              <div className="text-xs text-gray-400 mt-0.5">
                {it.author_name || '익명'} · {new Date(it.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">게임 커뮤니티에 오신 것을 환영합니다!</h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          오류: {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[180px] flex items-center justify-center">로딩중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BoardPanel title="공지사항 (최근 3건)" boardKey="notice" items={noticeItems} />
          <BoardPanel title="게임게시판 (최근 3건)" boardKey="game" items={gameItems} />
          <BoardPanel title="자유게시판 (최근 3건)" boardKey="free" items={freeItems} />
        </div>
      )}
    </div>
  );
}

export default App;
