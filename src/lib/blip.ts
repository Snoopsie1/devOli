/**
 * The one sound on the site: a short square-wave arpeggio when the Konami code
 * flips secret mode on or off.
 *
 * Generated, not an asset — same reasoning as the head geometry, and it keeps
 * the no-decorative-files rule intact. The context is created lazily on first
 * play, which is always inside a keydown or pointerup handler, so browser
 * autoplay policy is satisfied and nothing touches `window` during SSR.
 */

let ctx: AudioContext | null = null;

/** Rising notes when entering secret mode, falling when leaving. */
export function blip(entering: boolean): void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return;
  try {
    ctx ??= new AudioContext();
    // Safari suspends the context until a gesture; this call happens inside one.
    if (ctx.state === 'suspended') void ctx.resume();

    const notes = entering ? [523.25, 659.25, 987.77] : [987.77, 659.25, 440.0];
    const step = 0.075; // seconds per note
    const t0 = ctx.currentTime;

    notes.forEach((hz, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'square'; // the chiptone
      osc.frequency.value = hz;
      const at = t0 + i * step;
      // Flat-then-cliff envelope: no click on attack, no tail on release.
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.08, at + 0.008);
      gain.gain.setValueAtTime(0.08, at + step * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + step);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(at);
      osc.stop(at + step + 0.02);
    });
  } catch {
    // Audio is decoration on a portfolio; a blocked or exhausted context must
    // never take the secret mode down with it.
  }
}
