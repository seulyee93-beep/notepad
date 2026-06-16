import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } else {
          // 토큰 없으면 자동 로그인
          const res = await api.post('/auth/auto');
          localStorage.setItem('token', res.data.token);
          setUser(res.data.user);
        }
      } catch {
        // 토큰 만료 등 오류 시 재발급
        try {
          localStorage.removeItem('token');
          const res = await api.post('/auth/auto');
          localStorage.setItem('token', res.data.token);
          setUser(res.data.user);
        } catch {
          // 서버 연결 실패
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
