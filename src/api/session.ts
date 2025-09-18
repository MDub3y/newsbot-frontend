import { api } from './client';
import type { ChatMessage } from '../types';

export async function fetchHistory(sessionId: string) {
  const { data } = await api.get<{ sessionId: string; history: ChatMessage[] }>(
    `/api/session/${sessionId}/history`
  );
  return data.history;
}

export async function resetSession(sessionId: string) {
  const { data } = await api.post(`/api/session/${sessionId}/reset`, {});
  return data;
}

export async function askOnce(sessionId: string, question: string, topK = 5) {
  try {
    const { data } = await api.post(`/api/chat`, { sessionId, message: question, topK });
    const contexts = (data.contexts ?? data.sources ?? []) as Array<{ source: string; score?: number }>;
    return { answer: data.answer as string, sources: contexts };
  } catch {
    const { data } = await api.post(`/api/chat/ask`, { sessionId, question, topK });
    return data as { answer: string; sources: Array<{ source: string; score: number }> };
  }
}
