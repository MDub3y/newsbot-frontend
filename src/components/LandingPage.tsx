import { useEffect, useMemo } from 'react';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const SOURCES = [
  { key: 'nytimes',   name: 'The New York Times', src: '/nytimes.jpg' },
  { key: 'aljazeera', name: 'Al Jazeera',         src: '/aljazeera.png' },
  { key: 'bbc',       name: 'BBC',                src: '/bbc.jpg' },
  { key: 'reuters',   name: 'Reuters',            src: '/reuters.png' },
  { key: 'guardian',  name: 'The Guardian',       src: '/guardian.png' },
];

export default function LandingPage() {
  const nav = useNavigate();
  const { createThread, renameThread } = useSession();

  // Soft “pro” tone just on the landing page
  useEffect(() => {
    document.body.classList.add('theme--pro');
    return () => document.body.classList.remove('theme--pro');
  }, []);

  const start = (title?: string) => {
    const id = createThread();
    if (title) renameThread(id, title);
    nav(`/chat/${id}`);
  };

  const today = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }).format(new Date());
    } catch {
      return 'Today';
    }
  }, []);

  return (
    <div className="vx-shell">
      <Header />

      <main className="lp">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero__copy">
            <div className="lp-kicker">{today}</div>
            <h1>Clear answers from real news.</h1>
            <p>
              Ask questions against a fresh corpus of world news. We retrieve passages, synthesize them,
              and return <em>traceable</em> responses with citations.
            </p>
            <div className="lp-cta-row">
              <button className="lp-btn lp-btn--primary" onClick={() => start('International headlines')}>
                Start chatting
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M5 12h12m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button className="lp-btn lp-btn--ghost" onClick={() => start('How does this work?')}>
                How it works
              </button>
            </div>

            <div className="lp-bullets" aria-label="Highlights">
              <span>• Retrieval-augmented</span>
              <span>• Inline citations</span>
              <span>• Session threads</span>
            </div>
          </div>

          {/* Right: source logo wall */}
          <div className="lp-hero__panel">
            <div className="lp-logos" role="list">
              {SOURCES.map(s => (
                <button
                  key={s.key}
                  className="lp-logo"
                  role="listitem"
                  title={s.name}
                  onClick={() => start(`Summarize top stories from ${s.name}`)}
                >
                  <img src={s.src} alt={s.name} loading="eager" />
                </button>
              ))}
            </div>
            <div className="lp-note">Click a source to start a focused chat</div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-features">
          <article className="lp-card">
            <h3>Real citations</h3>
            <p>Every answer includes linked sources, so you can verify facts in a click.</p>
          </article>
          <article className="lp-card">
            <h3>Fresh corpus</h3>
            <p>We ingest recent headlines and article bodies, chunk them, and index for retrieval.</p>
          </article>
          <article className="lp-card">
            <h3>Context aware</h3>
            <p>Chats keep context per thread, so you can refine and compare angles easily.</p>
          </article>
        </section>

        {/* SOURCES STRIP */}
        <section className="lp-sources">
          <h4>Sources include</h4>
          <div className="lp-chips">
            {SOURCES.map(s => (
              <button
                key={s.key}
                className="lp-chip"
                onClick={() => start(`Summarize top stories from ${s.name}`)}
              >
                <img src={s.src} alt="" aria-hidden="true" />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* FOOTER BAND */}
        <section className="lp-foot">
          <div className="lp-foot__text">
            Built with RAG • Gemini • Qdrant • Redis — tailored for fast, cited news answers.
          </div>
          <button className="lp-btn lp-btn--primary" onClick={() => start('Start a new chat')}>
            New chat
          </button>
        </section>
      </main>
    </div>
  );
}
