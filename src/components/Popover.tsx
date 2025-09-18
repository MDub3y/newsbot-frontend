import { useEffect, useRef, useState } from 'react';

type PopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Popover({ open, anchorEl, onClose, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties | undefined>();
  const [arrowX, setArrowX] = useState<number>(16);

  // Position: below anchor, keep inside viewport
  useEffect(() => {
    if (!open || !anchorEl) return;
    const vr = { w: window.innerWidth, h: window.innerHeight };
    const ar = anchorEl.getBoundingClientRect();

    const width = 200;
    const margin = 8;
    const left = Math.min(Math.max(ar.right - width, margin), vr.w - width - margin);
    const top = Math.min(ar.bottom + margin, vr.h - margin - 10);

    const localArrowX = Math.max(14, Math.min(width - 14, ar.right - left - 22));
    setArrowX(localArrowX);

    setStyle({
      position: 'fixed',
      left,
      top,
      minWidth: width,
      zIndex: 1000,
    });
  }, [open, anchorEl]);

  // Close on outside / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && anchorEl && !anchorEl.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorEl]);

  if (!open) return null;

  return (
    <div ref={ref} className="vx-popover" style={style} role="menu" aria-label="Thread actions">
      <div className="vx-popover__arrow" style={{ left: arrowX }} />
      {children}
    </div>
  );
}
