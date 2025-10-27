import { useEffect, useMemo, useState } from 'react';
import axios from '../api';

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('pending'); // pending|approved|all
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 20;
  const approvedParam = useMemo(() => {
    if (tab === 'pending') return 'false';
    if (tab === 'approved') return 'true';
    return undefined;
  }, [tab]);

  const load = async () => {
    const params = {
      limit,
      offset: (page - 1) * limit,
    };
    if (q) params.q = q;
    if (approvedParam !== undefined) params.approved = approvedParam;

    const { data } = await axios.get('/api/admin/users', { params });
    setItems(data.items);
    setTotal(data.total);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const pages = Math.max(1, Math.ceil(total / limit));

  const approve = async (id, approve) => {
    await axios.put(`/api/admin/users/${id}/approve`, { approve });
    await load();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">회원 승인 관리</h1>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setTab('pending'); setPage(1); }}
          className={`px-3 py-1.5 rounded ${tab==='pending'?'bg-blue-600 text-white':'bg-gray-200'}`}
        >
          승인 대기
        </button>
        <button
          onClick={() => { setTab('approved'); setPage(1); }}
          className={`px-3 py-1.5 rounded ${tab==='approved'?'bg-blue-600 text-white':'bg-gray-200'}`}
        >
          승인 완료
        </button>
        <button
          onClick={() => { setTab('all'); setPage(1); }}
          className={`px-3 py-1.5 rounded ${tab==='all'?'bg-blue-600 text-white':'bg-gray-200'}`}
        >
          전체
        </button>

        <form onSubmit={onSearch} className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded px-3 py-2"
            placeholder="아이디/닉네임/메일"
          />
          <button className="px-3 py-2 rounded bg-gray-800 text-white">검색</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">아이디</th>
                <th className="px-3 py-2 text-left">닉네임</th>
                <th className="px-3 py-2 text-left">이메일</th>
                <th className="px-3 py-2 text-left">승인</th>
                <th className="px-3 py-2 text-left">권한</th>
                <th className="px-3 py-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="px-3 py-2">{u.id}</td>
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2">{u.nickname}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {u.is_approved ? (
                      <span className="text-green-700 bg-green-100 px-2 py-1 rounded text-sm">승인</span>
                    ) : (
                      <span className="text-orange-700 bg-orange-100 px-2 py-1 rounded text-sm">대기</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{u.is_admin ? '관리자' : '일반'}</td>
                  <td className="px-3 py-2 text-right">
                    {u.is_approved ? (
                      <button
                        onClick={() => approve(u.id, false)}
                        className="px-3 py-1 rounded border hover:bg-gray-50"
                      >
                        승인 해제
                      </button>
                    ) : (
                      <button
                        onClick={() => approve(u.id, true)}
                        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        승인
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-3 py-10 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded border ${p===page?'bg-gray-800 text-white':'hover:bg-gray-100'}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
