import { ImageResponse } from 'next/og';

// Code-generated favicon — pixel-yellow initials "OR" on the deep-space
// background. Keeps the "no static image assets" spirit.
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05050e',
          color: '#ffd23f',
          fontSize: 34,
        }}
      >
        OR
      </div>
    ),
    { ...size },
  );
}
