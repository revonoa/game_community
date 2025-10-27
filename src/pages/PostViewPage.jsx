// src/pages/PostViewPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api';

export default function PostViewPage() {
  const { board, id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/boards/${board}/posts/${id}`);
        if (!mounted) return;
        setPost(data);
      } catch (err) {
        console.error('PostView load error', err);
        setError(err?.response?.data?.message || '게시글을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [board, id]);

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center">불러오는 중...</div>;
  if (error) return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-red-600 mb-4">{error}</div>
      <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">뒤로</button>
    </div>
  );
  if (!post) return <div className="min-h-[40vh] flex items-center justify-center">게시글이 없습니다.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <div className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
      </div>

      <div className="mb-6 text-sm text-gray-700">작성자: {post.author_name || '알 수 없음'}</div>

      <article className="prose max-w-none mb-6">
        {/* 단순 텍스트 출력. 필요하면 마크다운/HTML 변환 적용 */}
        <div style={{ whiteSpace: 'pre-wrap' }}>{post.body}</div>
      </article>

      <div className="flex gap-2">
        <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">목록으로</button>
        {/* 편집/삭제 버튼은 권한 체크 후 노출하려면 추가 로직 필요 */}
      </div>
    </div>
  );
}
