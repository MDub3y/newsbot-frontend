import type { ChatMessage } from '../types';
import clsx from 'clsx';
import Avatar from './Avatar';
import React from 'react';

function extractCitations(text: string) {
  const cites: string[] = [];
  const cleaned = text.replace(/\[source:\s*([^\]]+)\]/gi, (_m, g1: string) => {
    cites.push(String(g1).trim());
    return '';
  });
  return { cleaned: cleaned.trim(), cites };
}

function linkify(parts: (string | React.ReactNode)[]) {
  const out: React.ReactNode[] = [];
  parts.forEach((chunk, idx) => {
    if (typeof chunk !== 'string') { out.push(chunk); return; }
    const bits = chunk.split(/(https?:\/\/[^\s)]+)(?=[\s)]|$)/g);
    bits.forEach((b, i) => {
      if (/^https?:\/\//.test(b)) {
        out.push(<a key={`${idx}-${i}`} href={b} target="_blank" rel="noreferrer" className="vx-link">{b}</a>);
      } else {
        out.push(<React.Fragment key={`${idx}-${i}`}>{b}</React.Fragment>);
      }
    });
  });
  return out;
}

function renderInline(text: string): React.ReactNode[] {
  type Node = string | React.ReactNode;

  // helper: split each string node by a regex and wrap matches
  const splitWrap = (
    list: Node[],
    re: RegExp,
    isWrapped: (s: string) => boolean,
    wrap: (s: string, key: string) => React.ReactNode,
    keyPrefix: string
  ): Node[] => {
    const out: Node[] = [];
    let idx = 0;

    for (const item of list) {
      if (typeof item !== 'string') {
        out.push(item);
        continue;
      }
      const parts = item.split(re);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (isWrapped(p)) out.push(wrap(p, `${keyPrefix}-${idx}-${i}`));
        else out.push(p);
      }
      idx++;
    }
    return out;
  };

  // start with raw text
  let nodes: Node[] = [text ?? ''];

  // order matters: code -> bold -> italic
  nodes = splitWrap(
    nodes,
    /(`[^`]+`)/g,
    (p) => p.startsWith('`') && p.endsWith('`'),
    (p, key) => <code key={key} className="vx-code">{p.slice(1, -1)}</code>,
    'c'
  );

  nodes = splitWrap(
    nodes,
    /(\*\*[^*]+\*\*)/g,
    (p) => p.startsWith('**') && p.endsWith('**'),
    (p, key) => <strong key={key}>{p.slice(2, -2)}</strong>,
    'b'
  );

  nodes = splitWrap(
    nodes,
    /(_[^_]+_)/g,
    (p) => p.startsWith('_') && p.endsWith('_'),
    (p, key) => <em key={key}>{p.slice(1, -1)}</em>,
    'i'
  );

  // finally, linkify URLs inside the resulting nodes
  return linkify(nodes);
}


type Block =
  | { kind: 'p'; text: string; cites: string[] }
  | { kind: 'ul'; items: { text: string; cites: string[] }[] }
  | { kind: 'ol'; items: { text: string; cites: string[] }[] };

function parseBlocks(input: string): Block[] {
  const lines = input.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let accList: { ordered: boolean; items: { text: string; cites: string[] }[] } | null = null;

  const flushList = () => {
    if (!accList) return;
    blocks.push({
      kind: accList.ordered ? 'ol' : 'ul',
      items: accList.items,
    });
    accList = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }

    const mBullet = line.match(/^[-*]\s+(.+)$/);
    const mNum   = line.match(/^\d+\.\s+(.+)$/);

    if (mBullet || mNum) {
      const ordered = Boolean(mNum);
      const text = (mBullet ? mBullet[1] : mNum![1]).trim();
      const { cleaned, cites } = extractCitations(text);

      if (!accList || accList.ordered !== ordered) {
        flushList();
        accList = { ordered, items: [] };
      }
      accList.items.push({ text: cleaned, cites });
    } else {
      flushList();
      const { cleaned, cites } = extractCitations(line);
      blocks.push({ kind: 'p', text: cleaned, cites });
    }
  }
  flushList();
  return blocks;
}

export default function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className={clsx('vx-msg', 'vx-msg--user')}>
        <Avatar kind="user" />
        <div className="vx-msg__bubble">{msg.content}</div>
      </div>
    );
  }

  // Assistant rendering
  const blocks = parseBlocks(msg.content);

  return (
    <div className={clsx('vx-msg', 'vx-msg--bot')}>
      <Avatar kind="bot" />
      <div className="vx-msg__bubble">
        {blocks.map((b, idx) => {
          if (b.kind === 'p') {
            return (
              <div key={idx} className="vx-block">
                <p>{renderInline(b.text)}</p>
                {b.cites.length > 0 && (
                  <div className="vx-badges">
                    {b.cites.map((c, i) => <span key={i} className="vx-badge">source: {c}</span>)}
                  </div>
                )}
              </div>
            );
          }
          if (b.kind === 'ul' || b.kind === 'ol') {
            const ListTag: any = b.kind === 'ol' ? 'ol' : 'ul';
            return (
              <div key={idx} className="vx-block">
                <ListTag>
                  {b.items.map((it, i) => (
                    <li key={i}>
                      <span>{renderInline(it.text)}</span>
                      {it.cites.length > 0 && (
                        <span className="vx-badges-inline">
                          {it.cites.map((c, j) => <span key={j} className="vx-badge">source: {c}</span>)}
                        </span>
                      )}
                    </li>
                  ))}
                </ListTag>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
