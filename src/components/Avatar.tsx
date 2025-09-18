export default function Avatar({ kind }: { kind: 'bot' | 'user' }) {
    return (
      <div className={`vx-avatar ${kind === 'bot' ? 'vx-avatar--bot' : 'vx-avatar--user'}`}>
        {kind === 'bot' ? (
          // minimal robot mark
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="7" width="14" height="10" rx="3" />
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
            <rect x="11" y="4" width="2" height="3" rx="1" />
          </svg>
        ) : (
          // minimal person mark
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="9" r="4" />
            <path d="M4 20c2-4 6-5 8-5s6 1 8 5" />
          </svg>
        )}
      </div>
    );
  }
  