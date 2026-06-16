import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainPage from './pages/MainPage';

function AppContent() {
  const { loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
