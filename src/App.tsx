import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Chat from './components/Chat';
import { SessionProvider } from './context/SessionContext';

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat/:sessionId" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}
