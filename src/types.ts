export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type WSOutbound = {
  type: 'user_message';
  sessionId: string;        // <-- add this
  content: string;
  topK?: number;
};

export type WSInbound =
  | { type: 'init'; sessionId?: string }   // <-- sessionId optional now
  | { type: 'assistant_chunk'; content: string }
  | { type: 'assistant_done' }
  | { type: 'error'; message: string };

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
};
