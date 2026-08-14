'use client';

import { useEffect, useRef } from 'react';
import { createSculptFace, type HeadVariant, type SculptFaceHandle, type SculptFaceOptions } from '@/lib/sculpt-engine';

type SculptFaceProps = SculptFaceOptions & {
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  /** Which head to show. Swaps in place — never remounts. Defaults to 'face'. */
  variant?: HeadVariant;
  /** Colours for the avatar variant. MUST be a stable reference (module const). */
  variantColors?: { skin?: string; ink?: string };
};

/**
 * Client-only wrapper that mounts the raw three.js head exactly once and never
 * re-initialises it. The engine lives for the component's whole lifetime, so
 * sculpt state persists across every screen change — the parent only mutates
 * this host div's style. Never give this component a `key` that changes.
 */
export default function SculptFace({ skin, brush, pixel, cameraZ, variant, variantColors, className, style, ariaLabel }: SculptFaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SculptFaceHandle | null>(null);
  // Freeze the options at first render — they must never re-init the engine.
  // (cameraZ is seeded here so the first render is at the right distance, then
  // kept in sync live by the effect below — NOT via a remount.)
  const optsRef = useRef<SculptFaceOptions>({ skin, brush, pixel, cameraZ });

  // Mount once, never again. Deps MUST stay [] — the head persists across every
  // screen and prop change; a remount would wipe sculpt state.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    handleRef.current = createSculptFace(host, optsRef.current);
    return () => {
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  // Live-update the camera distance (e.g. when crossing the mobile breakpoint)
  // without touching the mounted engine.
  useEffect(() => {
    if (cameraZ != null) handleRef.current?.setCameraZ(cameraZ);
  }, [cameraZ]);

  // Live head swap, same contract as the camera above: the engine stays mounted
  // and only its geometry is rebuilt. Sculpt state resets on a swap by design.
  useEffect(() => {
    if (variant != null) handleRef.current?.setHead(variant, variantColors);
  }, [variant, variantColors]);

  return <div ref={hostRef} className={className} style={style} role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel} />;
}
