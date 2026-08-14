import Stage from "@/components/Stage";
import { PROJECTS, SITE, SKILLS } from "@/data/content";
import { css } from "@/lib/css";

// The interactive stage is a client component whose initial screen is `boot`, so
// none of the portfolio copy reaches the server-rendered HTML. This block mirrors
// that same copy — straight from the content arrays, never hand-written — as
// visually-hidden text so crawlers and screen readers get the whole page without
// having to play through it. Clip-rect hiding, not `display:none`: the text stays
// in the accessibility tree and is real content users can reach in the UI.
const SR_ONLY =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0';

export default function Home() {
  return (
    <>
      <section aria-label="About Oliver Rasoli" style={css(SR_ONLY)}>
        <h1>Oliver Rasoli</h1>
        <p>{SITE.subtitle}</p>
        <p>{SITE.bio}</p>

        <h2>Projects</h2>
        {PROJECTS.map((p) => (
          <article key={p.num}>
            <h3>{p.name}</h3>
            <p>{p.blurb}</p>
            <p>{p.body}</p>
            <p>{p.stack}</p>
          </article>
        ))}

        <h2>Skills</h2>
        <ul>
          {SKILLS.map(([name]) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>

      <Stage />
    </>
  );
}
