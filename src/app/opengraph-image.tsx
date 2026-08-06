import { ImageResponse } from 'next/og';
import { SITE } from '@/data/content';

// Code-generated social preview card, on-brand with the site palette.
export const alt = `${SITE.name} · ${SITE.subtitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 34,
          background: 'radial-gradient(120% 90% at 50% 45%, #22246b 0%, #101040 42%, #05050e 100%)',
          color: '#dfe3ff',
        }}
      >
        <div style={{ display: 'flex', gap: 10, fontSize: 44 }}>
          <span style={{ color: '#ff4d4d' }}>●</span>
          <span style={{ color: '#ffd23f' }}>●</span>
          <span style={{ color: '#5b62d8' }}>●</span>
        </div>
        <div style={{ fontSize: 104, color: '#ffd23f' }}>{SITE.name}</div>
        <div style={{ fontSize: 30, color: '#9aa2e8' }}>{SITE.subtitle}</div>
      </div>
    ),
    { ...size },
  );
}
