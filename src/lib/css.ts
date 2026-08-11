/**
 * Parse a prototype-style CSS declaration string into a React style object.
 *
 * The whole UI is written as inline declaration strings (the idiom carried over
 * from `docs/design-handoff/reference/Portfolio Prototype.dc.html`), so this
 * lives in `lib` and is shared by every component that follows it.
 */
export function css(style: string): React.CSSProperties {
  const obj: Record<string, string> = {};
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop) continue;
    const camel = prop.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    obj[camel] = val;
  }
  return obj as React.CSSProperties;
}

/** Shared mono stack, matched to the `next/font` variable in the root layout. */
export const MONO = 'var(--font-jetbrains-mono),monospace';
