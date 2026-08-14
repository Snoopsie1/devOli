'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { PROJECTS, SKILLS, SITE } from '@/data/content';
import { css, MONO } from '@/lib/css';
import PixelGallery from '@/components/PixelGallery';

// Client-only: the head touches window + WebGL, and it must never SSR.
const SculptFace = dynamic(() => import('@/components/SculptFace'), { ssr: false });

type Screen = 'boot' | 'work' | 'about' | 'contact';
// A "view" is what can crossfade in/out: the four screens plus the detail overlay.
type View = Screen | 'detail';

const EXIT_MS = 220; // exit animation length; must match `fadeout` below
// Project mark on a file-select card. Desktop multiplies this by the 1.4× UI zoom.
const ICON_PX = 34;

/** SSR-safe media query hook (server + first client render report `false`). */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    [query],
  );
  const getSnapshot = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default function Stage() {
  const [screen, setScreen] = useState<Screen>('boot');
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  // The single view that is currently animating OUT, kept mounted for EXIT_MS.
  const [leaving, setLeaving] = useState<{ view: View; detailIdx: number | null } | null>(null);

  // Focus management for the detail dialog.
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<number | null>(null);

  const m = useMediaQuery('(max-width: 719px)'); // phone (w < 720)
  const coarse = useMediaQuery('(pointer: coarse)');
  const touch = m || coarse;
  // Camera pulled further back on phones so the full-bleed head is small enough
  // that the ears clear the narrow screen edges. Depends only on `m`, so it never
  // changes while navigating screens (no per-screen glide pump).
  const cameraZ = m ? 9.5 : 7.2;

  const currentView: View = detail !== null ? 'detail' : screen;

  // Drop the outgoing view once its exit animation has played.
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), EXIT_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  const go = useCallback(
    (s: Screen) => {
      const from: View = detail !== null ? 'detail' : screen;
      if (from === s) return; // re-clicking the active screen is a no-op
      setLeaving({ view: from, detailIdx: detail });
      setScreen(s);
      setDetail(null);
    },
    [screen, detail],
  );

  const openDetail = useCallback((i: number) => {
    returnTo.current = i; // card to restore focus to on close
    setLeaving({ view: 'work', detailIdx: null });
    setDetail(i);
    setSel(i);
  }, []);

  const closeDetail = useCallback(() => {
    setDetail((cur) => {
      if (cur === null) return null;
      setLeaving({ view: 'detail', detailIdx: cur });
      return null;
    });
  }, []);

  // Move focus into the dialog on open, and back to the originating card on close.
  useEffect(() => {
    if (detail !== null) {
      closeBtnRef.current?.focus({ preventScroll: true });
    } else if (returnTo.current !== null) {
      // Restore by query, not by stored element: the work screen unmounts while
      // the detail is open, so any cached node is stale by the time we close.
      if (screen === 'work') {
        document.querySelector<HTMLElement>(`[data-file-card="${returnTo.current}"]`)?.focus();
      }
      returnTo.current = null;
    }
  }, [detail, screen]);

  // Global keyboard nav — mirrors the prototype state machine.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detail !== null) closeDetail();
        else if (screen !== 'boot') go('boot');
        return;
      }
      if (e.key === 'Enter') {
        // A focused button/link owns Enter/Space; don't double-fire the global action.
        if ((e.target as HTMLElement).closest?.('button, a')) return;
        if (screen === 'boot') go('work');
        else if (screen === 'work' && detail === null) openDetail(sel);
        return;
      }
      if (screen !== 'work' || detail !== null) return;
      const cols = m ? 1 : Math.min(PROJECTS.length, 3);
      const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        const next = (sel + d + PROJECTS.length) % PROJECTS.length;
        setSel(next);
        // Roving tabindex: keep DOM focus on the selected card when arrowing.
        if ((e.target as HTMLElement).closest?.('[data-file-card]')) {
          document.querySelector<HTMLElement>(`[data-file-card="${next}"]`)?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, sel, detail, m, go, openDetail, closeDetail]);

  // Is a given view entering, leaving, or absent this render?
  const modeOf = (v: View): 'in' | 'out' | null =>
    currentView === v ? 'in' : leaving?.view === v ? 'out' : null;
  const animCss = (mode: 'in' | 'out') =>
    mode === 'in'
      ? 'animation:fadein .28s ease-out'
      : `animation:fadeout ${EXIT_MS / 1000}s ease-in forwards;pointer-events:none`;

  const bootMode = modeOf('boot');
  const workMode = modeOf('work');
  const detailMode = modeOf('detail');
  const aboutMode = modeOf('about');
  const contactMode = modeOf('contact');

  // Detail content survives its own exit: fall back to the leaving index.
  const dIdx = detail ?? leaving?.detailIdx ?? null;
  const d = dIdx === null ? null : PROJECTS[dIdx];

  const bottomSafe = m ? 68 : 0; // room for the phone nav bar
  const sectionTitle = `flex:none;font-size:${m ? 11 : 13}px;font-weight:400;letter-spacing:3px;color:var(--acc);text-shadow:0 3px 0 var(--acc-sh);text-align:center`;

  // background watermark: fewer, smaller marks on phone
  const words = ['OLIVER', 'RASOLI'];
  const count = m ? 12 : 16;
  const marks = Array.from({ length: count }, (_, i) => words[(i + Math.floor(i / (m ? 3 : 4))) % 2]);

  // Face placement per screen and per device. Normalised to vw/vh (no `auto`)
  // so CSS can interpolate every edge, and glided via a transition on the
  // geometric props + opacity. NOT transform-based: the render buffer is sized
  // from clientWidth, so real width/height changes keep the crunch correct.
  const faceGlide = 'transition:left .34s ease-out,top .34s ease-out,width .34s ease-out,height .34s ease-out,opacity .28s ease-out';
  const faceByScreen: Record<Screen, string> = m
    ? {
        // Full-bleed boot (no visible canvas edge → downward stretch-sculpts
        // never clip mid-screen). Other screens' heights are scaled ×9.5/7.2 to
        // offset the mobile camera pull-back, centers preserved.
        boot: `position:absolute;left:0;width:100vw;top:0;height:100dvh;opacity:1;z-index:3;${faceGlide}`,
        work: `position:absolute;left:0;width:100vw;top:-3.5vh;height:70vh;opacity:.13;z-index:1;pointer-events:none;${faceGlide}`,
        about: `position:absolute;left:0;width:100vw;top:-5vh;height:59vh;opacity:1;z-index:3;${faceGlide}`,
        contact: `position:absolute;left:0;width:100vw;top:-5.5vh;height:70vh;opacity:1;z-index:3;${faceGlide}`,
      }
    : {
        boot: `position:absolute;left:0;width:100vw;top:0;height:100dvh;opacity:1;z-index:3;${faceGlide}`,
        work: `position:absolute;left:0;width:100vw;top:-3vh;height:70vh;opacity:.16;z-index:1;pointer-events:none;${faceGlide}`,
        about: `position:absolute;left:52vw;width:52vw;top:-13vh;height:117vh;opacity:1;z-index:3;${faceGlide}`,
        contact: `position:absolute;left:0;width:100vw;top:-16vh;height:99vh;opacity:1;z-index:3;${faceGlide}`,
      };

  const navItems: [string, Screen][] = [['WORK', 'work'], ['ABOUT', 'about'], ['CONTACT', 'contact']];

  const rootStyle: React.CSSProperties = {
    position: 'relative',
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    background: 'radial-gradient(120% 90% at 50% 45%, var(--bg-top) 0%, var(--bg-mid) 42%, var(--bg-deep) 100%)',
    fontFamily: 'var(--font-press-start), monospace',
    color: 'var(--tx)',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const watermarkStyle = `position:absolute;inset:0;z-index:1;display:grid;grid-template-columns:repeat(${m ? 3 : 4},1fr);grid-auto-rows:${m ? 18 : 22}vh;place-items:center;animation:swell 6s ease-in-out infinite;pointer-events:none`;
  const markStyle = `font-size:${m ? 18 : 30}px;color:var(--wm);text-shadow:0 3px 0 var(--wm-sh)`;

  const brandStyle = m
    ? 'position:absolute;top:20px;left:0;right:0;z-index:8;display:flex;flex-direction:column;align-items:center;gap:9px;padding:0 16px;text-align:center'
    : 'position:absolute;top:34px;left:44px;z-index:8;display:flex;flex-direction:column;gap:11px';
  // font-weight:400 — Press Start 2P has one weight; an <h1>'s UA bold would synthesize a heavier face.
  const brandNameStyle = `font-size:${m ? 22 : 20}px;font-weight:400;color:var(--acc);text-shadow:0 3px 0 var(--acc-sh)`;
  const brandSubStyle = `font-size:${m ? 7 : 9}px;letter-spacing:2px;line-height:1.7;color:var(--tx-nav)`;

  const navStyle = m
    ? 'position:absolute;left:0;right:0;bottom:0;z-index:12;display:flex;background:var(--nav-bg);border-top:3px solid var(--bd)'
    : 'position:absolute;top:34px;right:44px;z-index:8;display:flex;gap:26px;font-size:12px;letter-spacing:1px';

  const bootStyle = `position:absolute;left:0;right:0;bottom:${m ? bottomSafe + 24 : 64}px;z-index:8;display:flex;flex-direction:column;align-items:center;gap:${m ? 14 : 20}px;padding:0 20px`;
  const pressStyle = `font-size:${m ? 20 : 26}px;color:var(--press);text-shadow:0 4px 0 var(--press-sh)`;
  const startStyle = `font-size:${m ? 20 : 26}px;color:var(--acc);text-shadow:0 4px 0 var(--acc-sh)`;
  const bootHintStyle = `font-size:${m ? 7 : 9}px;letter-spacing:1px;line-height:1.8;color:var(--tx-dim);text-align:center`;
  const bootHint = touch ? 'DRAG MY FACE · DOUBLE-TAP RESETS' : 'DRAG MY FACE · DOUBLE-CLICK RESETS · ENTER TO BEGIN';

  const workStyle = `position:absolute;left:0;right:0;top:${m ? 96 : 106}px;bottom:${m ? bottomSafe + 8 : 56}px;z-index:8;display:flex;flex-direction:column;align-items:center;gap:${m ? 12 : 18}px;padding:0 ${m ? 16 : 44}px;box-sizing:border-box`;
  const gridStyle = `flex:1;min-height:0;width:100%;max-width:1000px;overflow:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(${m ? 1 : Math.min(PROJECTS.length, 3)},minmax(0,1fr));grid-auto-rows:min-content;gap:${m ? 12 : 16}px;padding:2px 4px 8px;box-sizing:border-box`;
  const workHintStyle = `flex:none;font-size:${m ? 7 : 9}px;color:var(--tx-dim);letter-spacing:1px;text-align:center;line-height:1.7`;
  const workHint = touch ? 'TAP A FILE TO OPEN · SCROLL FOR MORE' : '↑ ↓ ← → TO MOVE · ENTER TO OPEN · ESC TO GO BACK';

  const detailWrapStyle = `position:absolute;left:0;right:0;top:${m ? 12 : 110}px;bottom:${m ? bottomSafe + 12 : 60}px;z-index:9;display:flex;justify-content:center;padding:0 ${m ? 12 : 0}px;box-sizing:border-box`;
  const detailPanelStyle = `width:${m ? '100%' : '820px'};max-width:${m ? '100%' : '88vw'};padding:${m ? '20px 18px' : '36px 40px'};background:var(--panel);border:3px solid var(--bd);box-shadow:0 0 0 3px var(--panel-ring), 0 24px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:${m ? 16 : 22}px;overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box`;
  const detailTitleStyle = `font-size:${m ? 14 : 22}px;font-weight:400;line-height:1.5;color:var(--tx-bright);text-shadow:0 3px 0 var(--title-sh)`;
  const detailBodyStyle = `font-family:${MONO};font-size:${m ? 13 : 15}px;line-height:1.75;color:var(--tx-body2)`;
  const factsStyle = `display:grid;grid-template-columns:repeat(${m ? 1 : 3},1fr);gap:${m ? 14 : 18}px;padding-top:${m ? 14 : 18}px;border-top:2px solid var(--bd-soft)`;
  const closeStyle = `font-size:9px;letter-spacing:1px;color:var(--tx-dim);cursor:pointer;flex:none;display:inline-flex;align-items:center;justify-content:center;${m ? 'min-height:48px;padding:0 16px;border:2px solid var(--bd)' : 'padding:2px 0'}`;
  const closeLabel = touch ? 'CLOSE ✕' : '[ESC] CLOSE';

  const aboutStyle = m
    ? `position:absolute;left:0;right:0;top:44vh;bottom:${bottomSafe + 8}px;z-index:8;display:flex;flex-direction:column;gap:16px;padding:0 18px;overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box`
    : 'position:absolute;left:7vw;top:150px;width:520px;z-index:8;display:flex;flex-direction:column;gap:24px';
  const aboutBodyStyle = `font-family:${MONO};font-size:${m ? 13 : 16}px;line-height:1.8;color:var(--tx-body)`;

  const contactStyle = `position:absolute;left:0;right:0;bottom:${m ? bottomSafe + 20 + 'px' : '12vh'};z-index:8;display:flex;flex-direction:column;align-items:center;gap:${m ? 16 : 22}px;padding:0 18px;box-sizing:border-box`;
  const contactRowStyle = m
    ? 'display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px'
    : 'display:flex;gap:16px';
  const ctaPrimary = `display:flex;align-items:center;justify-content:center;min-height:${m ? 52 : 0}px;padding:16px 24px;font-size:11px;letter-spacing:1px;color:var(--on-acc);background:var(--acc);box-shadow:0 5px 0 var(--acc-sh2)`;
  const ctaSecondary = `display:flex;align-items:center;justify-content:center;min-height:${m ? 52 : 0}px;padding:16px 24px;font-size:11px;letter-spacing:1px;color:var(--tx);background:var(--btn2);box-shadow:0 5px 0 var(--btn2-sh)`;
  // Compact secondary button reused for the per-project links inside the detail panel.
  const detailLinkStyle = `display:inline-flex;align-items:center;justify-content:center;min-height:${m ? 44 : 0}px;padding:${m ? '12px 18px' : '10px 16px'};font-size:10px;letter-spacing:1px;color:var(--tx);background:var(--btn2);box-shadow:0 4px 0 var(--btn2-sh)`;

  // Desktop-only: magnify the whole UI layer (brand, nav, all screens) by 1.4×,
  // like a 140% browser zoom, WITHOUT touching the 3D head (it lives outside
  // this wrapper). The box is pre-shrunk to 100vw/1.4 so `zoom` renders it back
  // to exactly the viewport. `pointer-events:none` lets face-drags fall through
  // the transparent gaps to the head; interactive groups re-enable it below.
  const UI_SCALE = 1.4;
  const uiWrapStyle = m
    ? 'display:contents'
    : `position:absolute;top:0;left:0;width:calc(100vw / ${UI_SCALE});height:calc(100dvh / ${UI_SCALE});z-index:5;zoom:${UI_SCALE};pointer-events:none`;

  return (
    <div style={rootStyle}>
      {/* watermark grid (decorative) */}
      <div style={css(watermarkStyle)} aria-hidden="true">
        {marks.map((t, i) => (
          <span key={i} style={css(markStyle)}>{t}</span>
        ))}
      </div>

      {/* 3D head — mounted once, never unmounts; only its style changes (glides) */}
      <SculptFace
        skin="#e3ab7f"
        brush={0.52}
        pixel={0.3}
        cameraZ={cameraZ}
        ariaLabel="Sculptable low-poly 3D head"
        style={css(faceByScreen[screen])}
      />

      {/* UI layer — desktop-zoomed 1.4×, head excluded (it's a root sibling above) */}
      <div style={css(uiWrapStyle)}>
      {/* brand */}
      <div style={css(brandStyle + ';pointer-events:auto')}>
        {/* Not an <h1>: the page's single h1 lives in the server-rendered
            summary in `src/app/page.tsx`. Styling is unchanged. */}
        <div style={css(brandNameStyle)}>
          <button type="button" onClick={() => go('boot')} style={{ cursor: 'pointer' }}>{SITE.name}</button>
        </div>
        <span style={css(brandSubStyle)}>{SITE.subtitle}</span>
      </div>

      {/* nav */}
      <nav aria-label="Main menu" style={css(navStyle + ';pointer-events:auto')}>
        {navItems.map(([label, key]) => {
          const active = screen === key;
          const style = m
            ? `flex:1;display:flex;align-items:center;justify-content:center;min-height:52px;font-size:12px;letter-spacing:1px;cursor:pointer;color:${active ? 'var(--on-acc)' : 'var(--tx-nav)'};background:${active ? 'var(--acc)' : 'transparent'}`
            : `cursor:pointer;padding-bottom:5px;border-bottom:3px solid ${active ? 'var(--acc)' : 'transparent'};color:${active || hover === key ? 'var(--acc)' : 'var(--tx-nav)'}`;
          return (
            <button
              key={key}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => go(key)}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
              style={css(style)}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <main style={{ display: 'contents' }}>
        {/* boot / title */}
        {bootMode && (
          <div style={css(`${bootStyle};${animCss(bootMode)};pointer-events:auto`)} inert={bootMode === 'out' ? true : undefined}>
            <button
              type="button"
              onClick={() => go('work')}
              style={css('display:flex;gap:12px;animation:blink 1.4s steps(1,end) infinite;cursor:pointer;padding:10px 4px')}
            >
              <span style={css(pressStyle)}>PRESS</span>
              <span style={css(startStyle)}>START</span>
            </button>
            <div style={css(bootHintStyle)}>{bootHint}</div>
          </div>
        )}

        {/* work / file select */}
        {workMode && (
          <div style={css(`${workStyle};${animCss(workMode)};pointer-events:auto`)} inert={workMode === 'out' ? true : undefined}>
            <h2 style={css(sectionTitle)}>SELECT A FILE</h2>
            <div style={css(gridStyle)}>
              {PROJECTS.map((p, i) => {
                const active = i === sel;
                const cardStyle = `width:100%;text-align:left;display:flex;flex-direction:column;gap:9px;padding:${m ? '16px 16px' : '15px 17px'};cursor:pointer;background:${active ? 'var(--card-active)' : 'var(--card)'};border:3px solid ${active ? 'var(--acc)' : 'var(--bd)'};box-shadow:0 6px 0 ${active ? 'var(--acc-sh2)' : 'var(--card-sh)'};transform:translateY(${active ? '-4px' : '0'});transition:transform .12s`;
                return (
                  <button
                    key={p.num}
                    type="button"
                    data-file-card={i}
                    tabIndex={i === sel ? 0 : -1}
                    onClick={() => openDetail(i)}
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    style={css(cardStyle)}
                  >
                    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {p.icon && (
                          // Decorative: the card names the project right below.
                          // eslint-disable-next-line @next/next/no-img-element -- pre-sized 128px WebP, no optimizer round-trip needed
                          <img
                            src={p.icon}
                            alt=""
                            width={128}
                            height={128}
                            loading="lazy"
                            decoding="async"
                            style={css(`display:block;flex:none;width:${ICON_PX}px;height:${ICON_PX}px;border:2px solid ${active ? 'var(--acc)' : 'var(--bd)'}`)}
                          />
                        )}
                        <span style={{ fontSize: '9px', color: 'var(--acc)', letterSpacing: '1px' }}>FILE {p.num}</span>
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--tx-dim)', flex: 'none' }}>{p.year}</span>
                    </span>
                    <span style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--tx-bright)' }}>{p.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: '12px', lineHeight: 1.55, color: 'var(--tx-mid)' }}>{p.blurb}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                      <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap' }}>
                        {Array.from({ length: 6 }, (_, k) => (
                          <span key={k} style={{ fontSize: '13px', color: k < p.stars ? 'var(--acc)' : 'var(--star-off)' }}>★</span>
                        ))}
                      </span>
                      <span style={{ fontSize: '8px', lineHeight: 1.6, color: 'var(--tx-dimmer)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.stack}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <span style={css(workHintStyle)}>{workHint}</span>
          </div>
        )}

        {/* file detail */}
        {detailMode && d && (
          <div style={css(`${detailWrapStyle};${animCss(detailMode)};pointer-events:auto`)} inert={detailMode === 'out' ? true : undefined}>
            <div style={css(detailPanelStyle)} role="dialog" aria-labelledby="detail-title">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--acc)' }}>FILE {d.num} · {d.year}</span>
                <button type="button" ref={closeBtnRef} onClick={closeDetail} style={css(closeStyle)}>{closeLabel}</button>
              </div>
              <h2 id="detail-title" style={css(detailTitleStyle)}>{d.name}</h2>
              <span style={css(detailBodyStyle)}>{d.body}</span>
              {d.screenshots && d.screenshots.length > 0 && (
                <PixelGallery shots={d.screenshots} mobile={m} />
              )}
              <div style={css(factsStyle)}>
                {d.facts.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '8px', letterSpacing: '2px', color: 'var(--tx-dimmer)' }}>{k}</span>
                    <span style={{ fontFamily: MONO, fontSize: '14px', color: 'var(--tx-strong)' }}>{v}</span>
                  </div>
                ))}
              </div>
              {d.links && d.links.length > 0 && (
                <div style={css(`display:flex;flex-wrap:wrap;gap:${m ? 10 : 12}px`)}>
                  {d.links.map(([label, href]) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={css(detailLinkStyle)}>{label}</a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* about / player profile */}
        {aboutMode && (
          <div style={css(`${aboutStyle};${animCss(aboutMode)};pointer-events:auto`)} inert={aboutMode === 'out' ? true : undefined}>
            <h2 style={css(sectionTitle)}>PLAYER PROFILE</h2>
            <span style={css(aboutBodyStyle)}>{SITE.bio}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {SKILLS.map(([k, v]) => (
                <div key={k} style={css(`display:flex;align-items:center;gap:${m ? 10 : 14}px`)}>
                  <span style={css(`width:${m ? 88 : 120}px;flex:none;font-size:${m ? 7 : 9}px;letter-spacing:1px;color:var(--tx-nav)`)}>{k}</span>
                  <div style={{ flex: 1, height: '14px', background: 'var(--track)', border: '2px solid var(--bd)' }}>
                    <div style={{ height: '100%', width: `${v * 100}%`, background: 'var(--acc)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* contact / continue */}
        {contactMode && (
          <div style={css(`${contactStyle};${animCss(contactMode)};pointer-events:auto`)} inert={contactMode === 'out' ? true : undefined}>
            <h2 style={css(sectionTitle)}>CONTINUE?</h2>
            <div style={css(contactRowStyle)}>
              {SITE.email && <a href={`mailto:${SITE.email}`} style={css(ctaPrimary)}>EMAIL ME</a>}
              {SITE.github && <a href={SITE.github} target="_blank" rel="noopener noreferrer" style={css(ctaSecondary)}>GITHUB</a>}
              {SITE.linkedin && <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" style={css(ctaSecondary)}>LINKEDIN</a>}
            </div>
            {SITE.footnote && (
              <span style={{ fontSize: '9px', lineHeight: 1.7, color: 'var(--tx-dim)', letterSpacing: '1px', textAlign: 'center' }}>
                {SITE.footnote}
              </span>
            )}
          </div>
        )}
      </main>
      </div>

      {/* scanlines */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,.16) 0 1px, transparent 1px 3px)', mixBlendMode: 'multiply', zIndex: 20 }} />
      {/* vignette */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 180px 60px rgba(0,0,0,.75)', zIndex: 21 }} />
    </div>
  );
}
