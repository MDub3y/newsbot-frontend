import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './Header';
import { useSession } from '../context/SessionContext';
import { useChat } from '../hooks/useChat';
import Message from './Message';
import ThreadList from './ThreadList';

export default function Chat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const nav = useNavigate();
  const { renameThread, createThread, ensureThread, threads } = useSession();

  // Sidebar behavior
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth > 1100 : true
  );
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth > 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // === Ensure a thread exists immediately ===
  useEffect(() => {
    if (!sessionId) {
      const id = createThread();
      nav(`/chat/${id}`, { replace: true });
      return;
    }
    ensureThread(sessionId);
  }, [sessionId, createThread, ensureThread, nav]);

  const [input, setInput] = useState('');
  const { messages, send, reset, loading, streaming, connected } = useChat(sessionId!);

  // Scroll-to-latest
  const feedRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const SCROLL_PAD = 24;
  const checkAtBottom = () => {
    const el = feedRef.current; if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_PAD;
    setAtBottom(nearBottom);
  };
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = feedRef.current; if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };
  useEffect(() => { if (atBottom) scrollToBottom('auto'); }, [messages, atBottom]);
  useEffect(() => {
    const el = feedRef.current; if (!el) return;
    const onScroll = () => checkAtBottom();
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-title from first user message
  const firstUser = useMemo(() => messages.find(m => m.role === 'user')?.content ?? '', [messages]);
  useEffect(() => {
    if (firstUser && sessionId) {
      const title = firstUser.slice(0, 50) + (firstUser.length > 50 ? '…' : '');
      renameThread(sessionId, title);
    }
  }, [firstUser, renameThread, sessionId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim(); if (!q) return;
    setInput('');
    await send(q);
  };

  const newChat = () => {
    const id = createThread();
    nav(`/chat/${id}`);
    setTimeout(() => scrollToBottom('auto'), 0);
  };

  return (
    <div className="vx-shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
      <Header onToggleSidebar={() => setSidebarOpen(s => !s)} />
      <div className="vx-backdrop" onClick={() => setSidebarOpen(false)} />

      <main className="vx-chat">
        <aside className="vx-sidebar">
          <div className="vx-sidebar__head">
            <button className="vx-btn vx-btn--block" onClick={newChat}>+ New chat</button>
            <button className="vx-btn vx-btn--danger vx-btn--block" onClick={() => reset()}>Reset</button>
          </div>
          <div className="vx-hint">
            <div>WS: {connected ? 'connected' : 'fallback'}</div>
            <div>Status: {loading ? (streaming ? 'streaming' : 'loading') : 'idle'}</div>
          </div>
          <div className="vx-sidebar__scroll">
            <h3 style={{ margin:'14px 0 8px' }}>All threads</h3>
            <ThreadList items={threads} activeId={sessionId!} />
          </div>
        </aside>

        <section className="vx-main">
          <div className="vx-feed" ref={feedRef}>
            {messages.length === 0 && !loading && (
              <div className="vx-empty-state">
                <h2>What’s new in the world?</h2>
                <p>Try: “Summarize today’s top headlines about renewable energy.”</p>
              </div>
            )}

            {messages.map((m, i) => <Message key={i} msg={m} />)}

            {/* Typing/Loading bubble before first chunk */}
            {loading && !streaming && (
              <div className="vx-msg vx-msg--bot">
                <div className="vx-msg__avatar"></div>
                <div className="vx-msg__bubble">
                  <div style={{padding:0, background:'transparent'}}>
                    <div className="vx-analyzing-inline">
                      <div className="vx-analyzing__pulse"><i/><i/></div>
                      <div className="vx-analyzing__text">Analyzing request…</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating "jump to latest" */}
            {!atBottom && (
              <button className="vx-goto-end" onClick={() => scrollToBottom()}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#0b0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          <form className="vx-composer" onSubmit={onSubmit}>
            <input
              className="vx-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the news…"
              aria-label="Type your message"
              onFocus={() => setTimeout(() => scrollToBottom('smooth'), 0)}
            />
            <button className="vx-send" disabled={!input.trim() || (loading && !streaming)} aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 11l5-6 5 6M12 5v14" stroke="#0b0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
