import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type Thread = { id: string; title: string; updatedAt: number };

type SessionCtx = {
  threads: Thread[];
  createThread: () => string;
  ensureThread: (id: string) => void;         // no-op if exists
  renameThread: (id: string, title: string) => void;
  removeThread: (id: string) => void;
};

const Ctx = createContext<SessionCtx | null>(null);
const KEY = 'voosh_threads';

function load(): Thread[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as Thread[]) : [];
    // normalize
    return Array.isArray(arr) ? arr.map(t => ({ ...t, title: t.title ?? 'New Chat' })) : [];
  } catch {
    return [];
  }
}
function save(v: Thread[]) {
  localStorage.setItem(KEY, JSON.stringify(v));
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>(load());

  useEffect(() => { save(threads); }, [threads]);

  const createThread = useCallback((): string => {
    const id = uuidv4();
    setThreads(prev => [{ id, title: 'New Chat', updatedAt: Date.now() }, ...prev]);
    return id;
  }, []);

  const ensureThread = useCallback((id: string) => {
    if (!id) return;
    setThreads(prev => (prev.some(t => t.id === id)
      ? prev
      : [{ id, title: 'New Chat', updatedAt: Date.now() }, ...prev]));
  }, []);

  const renameThread = useCallback((id: string, title: string) => {
    setThreads(prev =>
      prev.map(t => (t.id === id ? { ...t, title: title.trim() || 'Untitled', updatedAt: Date.now() } : t))
    );
  }, []);

  const removeThread = useCallback((id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
  }, []);

  const api = useMemo<SessionCtx>(() => ({
    threads, createThread, ensureThread, renameThread, removeThread
  }), [threads, createThread, ensureThread, renameThread, removeThread]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useSession = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('SessionContext missing');
  return ctx;
};
