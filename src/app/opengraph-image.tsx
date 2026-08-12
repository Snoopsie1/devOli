import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE } from '@/data/content';

// Code-generated social preview card, on-brand with the site palette. Built at
// build time, so it stays in sync with SITE instead of going stale like a
// checked-in screenshot would.
export const alt = `${SITE.name} · ${SITE.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PIXEL = 'Press Start 2P';

/**
 * Fetch the Press Start 2P TTF so the card renders in the site's own face.
 * `next/font/google` can't hand its files to satori, so this pulls the file
 * directly. Returns null if the network is unavailable — the card then falls
 * back to the default sans rather than failing the build.
 */
async function pixelFont(): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    // A desktop UA gets a TTF back; the default UA would yield woff2, which satori can't read.
    const css = await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    }).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [font, head] = await Promise.all([
    pixelFont(),
    readFile(join(process.cwd(), 'public', 'og', 'head.png')),
  ]);
  const headSrc = `data:image/png;base64,${head.toString('base64')}`;
  const pixel = font ? { fontFamily: PIXEL } : {};

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 64,
          padding: '0 78px',
          background: 'radial-gradient(120% 90% at 50% 45%, #22246b 0%, #101040 42%, #05050e 100%)',
          color: '#dfe3ff',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- satori renders this to PNG at build; next/image has no meaning here */}
        <img src={headSrc} alt="" width={372} height={372} style={{ border: '6px solid #3b45b8' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
          {/* Squares, not ● — Press Start 2P has no glyph for it and satori
              renders the missing one as tofu. Radius 0 is the house style anyway. */}
          <div style={{ display: 'flex', gap: 12 }}>
            {['#ff4d4d', '#ffd23f', '#5b62d8'].map((c) => (
              <div key={c} style={{ width: 20, height: 20, background: c }} />
            ))}
          </div>
          <div style={{ ...pixel, fontSize: 52, lineHeight: 1.35, color: '#ffd23f' }}>{SITE.name}</div>
          <div style={{ ...pixel, fontSize: 17, lineHeight: 1.7, color: '#9aa2e8' }}>{SITE.subtitle}</div>
          <div style={{ ...pixel, display: 'flex', gap: 14, fontSize: 22, paddingTop: 8 }}>
            <span style={{ color: '#ff4d4d' }}>PRESS</span>
            <span style={{ color: '#ffd23f' }}>START</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: PIXEL, data: font, style: 'normal', weight: 400 }] : undefined,
    },
  );
}
