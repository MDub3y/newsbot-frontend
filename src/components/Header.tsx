import { Link } from 'react-router-dom';

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <header className="vx-header">
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button className="vx-burger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <Link to="/" className="vx-header__brand">News RAG</Link>
      </div>
      <div className="vx-header__meta">RAG • Gemini • Qdrant • Redis</div>
    </header>
  );
}
