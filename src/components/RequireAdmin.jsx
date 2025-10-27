import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../api';

export default function RequireAdmin({children}){
    const [ok, setOk] = useState(null);
    const navigate = useNavigate();

    useEffect(()=>{
        let mounted = true;
        (async () =>{
            try{
                const { data } = await axios.get('/api/auth/me');
                if(!mounted) return;
                if(data?.isAdmin) setOk(true);
                else setOk(false);
            }catch{
                setOk(false);
            }
        })();

        return () => {mounted = false;};
    }, []);

    if(ok === false){
        return(
            <div className="container mx-auto px-4 py-10">
                <div className="max-w-lg mx-auto bg-white rounded-x1 shadow p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다.</h2>
                    <p className="text-gray-600 mb-4">관리자만 접근 가능한 페이지입니다.</p>
                    <button
                        onClick={()=>navigate('/')}
                        className="px-4 py2 rounded bg=blue-600 text-white hover:bg-blue-700">
                            홈으로</button>"
                </div>
            </div>
        );
    }
    return children;
}