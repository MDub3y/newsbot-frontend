// src/components/ThreadList.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import type { Thread } from '../types';

type Props = {
  items: Thread[];
  activeId?: string;
};

export default function ThreadList({ items, activeId }: Props) {
  const nav = useNavigate();
  const { renameThread, removeThread } = useSession();
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLUListElement>(null);

  // Close the popover when clicking outside or pressing Esc
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const onRowClick = (id: string) => nav(`/chat/${id}`);
  const onRowKeyDown = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(id);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenId(cur => (cur === id ? null : id));
  };

  const doRename = (e: React.MouseEvent, t: Thread) => {
    e.preventDefault();
    e.stopPropagation();
    const next = (prompt('Rename thread', t.title) ?? '').trim();
    if (next && next !== t.title) renameThread(t.id, next);
    setOpenId(null);
  };

  const doDelete = (e: React.MouseEvent, t: Thread) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this thread?')) removeThread(t.id);
    setOpenId(null);
  };

  return (
    <ul className="vx-threadlist" ref={rootRef}>
      {items.map(t => {
        const isActive = t.id === activeId;
        const menuButtonId = `menu-${t.id}`;
        const popId = `${menuButtonId}-popover`;

        return (
          <li key={t.id}>
            <div
              className="vx-thread-row"
              role="button"
              tabIndex={0}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onRowClick(t.id)}
              onKeyDown={onRowKeyDown(t.id)}
              title={t.title}
            >
              <span className="vx-thread-title" aria-label={t.title}>
                {t.title}
              </span>

              <div className="vx-thread-right">
                <button
                  id={menuButtonId}
                  className="vx-kebab"
                  aria-haspopup="menu"
                  aria-expanded={openId === t.id}
                  aria-controls={openId === t.id ? popId : undefined}
                  onClick={(e) => toggleMenu(e, t.id)}
                  title="Thread actions"
                >
                  ⋯
                </button>

                {openId === t.id && (
                  <div
                    id={popId}
                    className="vx-pop"
                    role="menu"
                    aria-labelledby={menuButtonId}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button role="menuitem" className="vx-pop__item" onClick={(e) => doRename(e, t)}>
                      Rename
                    </button>
                    <button role="menuitem" className="vx-pop__item vx-danger" onClick={(e) => doDelete(e, t)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
      {items.length === 0 && <li className="vx-empty">No threads yet.</li>}
    </ul>
  );
}
