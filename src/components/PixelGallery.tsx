'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Screenshot } from '@/data/content';
import { css, MONO } from '@/lib/css';

/**
 * Reusable screenshot strip + lightbox for a project's detail panel.
 *
 * Any `Project` with a `screenshots` array gets this for free — nothing here is
 * Gymie-specific. Thumbnails share one fixed height so portrait phone shots and
 * wide desktop shots line up in a single row; the lightbox is where an image is
 * actually readable.
 *
 * The overlay is portalled to `document.body` on purpose: the detail panel sits
 * inside the desktop `zoom:1.4` UI wrapper, and a `position:fixed` overlay
 * rendered inline would inherit that zoom and blow past the viewport.
 */
export default function PixelGallery({ shots, mobile }: { shots: Screenshot[]; mobile: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((cur) => (cur === null ? null : (cur + d + shots.length) % shots.length)),
    [shots.length],
  );

  // Capture phase + stopPropagation: Stage's window-level Escape handler would
  // otherwise close the whole detail panel along with the lightbox.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.stopPropagation(); e.preventDefault(); step(-1); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, close, step]);

  // Focus into the lightbox on open, back to its thumbnail on close.
  useEffect(() => {
    if (open !== null) {
      closeRef.current?.focus({ preventScroll: true });
    } else if (returnTo.current !== null) {
      document.querySelector<HTMLElement>(`[data-shot="${returnTo.current}"]`)?.focus({ preventScroll: true });
      returnTo.current = null;
    }
  }, [open]);

  if (shots.length === 0) return null;

  const thumbH = mobile ? 120 : 150;
  const labelStyle = 'font-size:8px;letter-spacing:2px;color:#7b83c9';
  const stripStyle = `display:flex;gap:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;padding:4px 4px 10px`;
  const shot = open === null ? null : shots[open];

  const ctlStyle = `display:inline-flex;align-items:center;justify-content:center;min-height:${mobile ? 48 : 44}px;min-width:${mobile ? 48 : 44}px;padding:0 16px;font-size:${mobile ? 11 : 10}px;letter-spacing:1px;color:#dfe3ff;background:#242a9e;box-shadow:0 4px 0 #10144f;cursor:pointer`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <span style={css(labelStyle)}>SCREENSHOTS</span>
      <div style={css(stripStyle)}>
        {shots.map((s, i) => (
          <button
            key={s.src}
            type="button"
            data-shot={i}
            onClick={() => { returnTo.current = i; setOpen(i); }}
            aria-label={`Open screenshot ${i + 1} of ${shots.length}: ${s.caption}`}
            style={css(`flex:none;height:${thumbH}px;padding:0;cursor:pointer;background:#0a0b26;border:3px solid #3b45b8;box-shadow:0 6px 0 #141a63`)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP; next/image would add an optimizer round-trip for no gain */}
            <img
              src={s.src}
              alt={s.alt}
              width={s.width}
              height={s.height}
              loading="lazy"
              decoding="async"
              style={{ display: 'block', height: '100%', width: 'auto' }}
            />
          </button>
        ))}
      </div>

      {/* `open` starts null, so the portal only ever runs after a click — never on the server. */}
      {shot && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${shot.caption} — screenshot ${(open ?? 0) + 1} of ${shots.length}`}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          style={css(`position:fixed;inset:0;z-index:15;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${mobile ? 12 : 16}px;padding:${mobile ? 16 : 28}px;background:rgba(5,5,14,.92);box-sizing:border-box`)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- see the thumbnail above */}
          <img
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            style={{
              maxWidth: '90vw', maxHeight: '70vh', width: 'auto', height: 'auto',
              border: '3px solid #3b45b8', boxShadow: '0 0 0 3px #0a0b26, 0 24px 60px rgba(0,0,0,.6)',
            }}
          />
          <span style={css(`font-family:${MONO};font-size:${mobile ? 11 : 12}px;color:#c2c9f5;text-align:center`)}>{shot.caption}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" onClick={() => step(-1)} aria-label="Previous screenshot" style={css(ctlStyle)}>◀</button>
            <span style={css(`font-size:9px;letter-spacing:1px;color:#8f97dd;min-width:52px;text-align:center`)}>
              {(open ?? 0) + 1} / {shots.length}
            </span>
            <button type="button" onClick={() => step(1)} aria-label="Next screenshot" style={css(ctlStyle)}>▶</button>
            <button type="button" ref={closeRef} onClick={close} style={css(ctlStyle)}>
              {mobile ? 'CLOSE ✕' : '[ESC] CLOSE'}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
