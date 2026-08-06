'use client';

import { useEffect, useRef } from 'react';
import { createSculptFace, type SculptFaceOptions } from '@/lib/sculpt-engine';

type SculptFaceProps = SculptFaceOptions & {
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
};

/**
 * Client-only wrapper that mounts the raw three.js head exactly once and never
 * re-initialises it. The engine lives for the component's whole lifetime, so
 * sculpt state persists across every screen change — the parent only mutates
 * this host div's style. Never give this component a `key` that changes.
 */
export default function SculptFace({ skin, brush, pixel, className, style, ariaLabel }: SculptFaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Freeze the options at first render — they must never re-init the engine.
  const optsRef = useRef<SculptFaceOptions>({ skin, brush, pixel });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const handle = createSculptFace(host, optsRef.current);
    return () => handle.dispose();
  }, []);

  return <div ref={hostRef} className={className} style={style} role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel} />;
}
