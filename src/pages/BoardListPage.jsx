// src/pages/BoardListPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from '../api';

export default function BoardListPage(){
  const { board } = useParams(); // notice|game|free
  const [items, setItems] = useState([]);
  const [total,setTotal] = useState(0);
  const [page,setPage] = useState(1);
  const [q,setQ] = useState('');
  const limit = 20;

  useEffect(()=>{
    const load = async () => {
      try{
        const { data } = await axios.get(`/api/boards/${board}/posts`, { params: { page, limit, q }});
        setItems(data.items);
        setTotal(data.total);
      }catch(e){
        console.error(e);
      }
    };
    load();
  }, [board, page, q]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{board === 'notice' ? '공지사항' : board === 'game' ? '게임게시판' : '자유게시판'}</h1>
        <div>
          <Link to={`/boards/${board}/new`} className="px-4 py-2 bg-blue-600 text-white rounded">글쓰기</Link>
        </div>
      </div>

      <div className="mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="검색" className="border px-3 py-2 rounded w-full max-w-sm"/>
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr><th className="p-3">번호</th><th>제목</th><th>작성자</th><th className="p-3">날짜</th></tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{it.id}</td>
                <td className="p-3"><Link to={`/boards/${board}/posts/${it.id}`} className="text-blue-600">{it.title}</Link></td>
                <td className="p-3">{it.author_name || '알수없음'}</td>
                <td className="p-3 text-sm">{new Date(it.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
