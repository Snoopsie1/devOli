// Real portfolio content for Oliver Rasoli. A few fields are best-effort and
// flagged for the owner to confirm (Gymie's year, skill percentages are
// self-ratings). No data fetching — static arrays.

export interface Project {
  num: string;
  year: string;
  name: string;
  blurb: string;
  stack: string;
  stars: number;
  body: string;
  facts: [string, string][];
  // Optional [label, href] pairs shown as buttons at the bottom of the detail
  // panel, e.g. ['LIVE', 'https://…'] / ['CODE', 'https://github.com/…'].
  links?: [string, string][];
}

export interface Site {
  name: string;       // brand block, all-caps, keep short
  subtitle: string;   // role · city, keep under ~35 chars
  bio: string;        // Player Profile prose, 2–3 sentences
  email: string | null;    // EMAIL ME button; null hides it
  github: string | null;   // GITHUB button; null hides it
  linkedin: string | null; // LINKEDIN button; null hides it
  footnote: string | null; // contact footnote; null hides it
}

export const SITE: Site = {
  name: 'OLIVER RASOLI',
  subtitle: 'FULL STACK ENGINEER · COPENHAGEN',
  bio: 'Full-stack engineer in Copenhagen. TypeScript top to bottom, as at home in a React front-end as in the services and data behind it. I build with AI agents in the loop and run work in parallel across worktrees, shipping faster without shipping worse. This whole page is a real-time mesh, so go ahead and poke the head.',
  email: 'oliverrasoli@gmail.com',
  github: 'https://github.com/Snoopsie1',
  linkedin: 'https://www.linkedin.com/in/oliver-rasoli-177aa8233/',
  footnote: null, // removed per owner
};

export const PROJECTS: Project[] = [
  {
    num: 'A', year: '2026', name: 'GYMIE — LIFT TRACKER',
    blurb: 'A workout tracker that never forgets a lift.',
    stack: 'NEXT.JS · TS · AUTH', stars: 5,
    body: 'A passwordless workout tracker. Sign in with a one-time email code, then log every set and watch your numbers climb over time. Built solo, end to end, from the auth flow and data model to the UI.',
    facts: [['ROLE', 'Solo, full-stack'], ['AUTH', 'Passwordless'], ['STATUS', 'Live']],
    links: [['LIVE', 'https://gymie.rasoli.dk']],
  },
  {
    num: 'B', year: '2026', name: 'DEV 64 — THIS PORTFOLIO',
    blurb: 'The sculptable low-poly head you are holding.',
    stack: 'NEXT.JS · THREE.JS · TS', stars: 5,
    body: 'A single-page portfolio styled as an N64 title screen. The head is a real-time three.js mesh you can drag to deform and spring back with a wobble, about 400 lines of vertex-weighted soft-body math. Built with an agent-driven workflow.',
    facts: [['ROLE', 'Solo build'], ['PARTS', '44 meshes'], ['BUILD', 'Agent-driven']],
    links: [['LIVE', 'https://rasoli.dk'], ['CODE', 'https://github.com/Snoopsie1/devOli']],
  },
];

// Self-rated 0–1. Owner should tune the numbers. AGENTIC DEV umbrellas
// AI-assisted / agent-driven development (parallel worktrees, agent workflows).
export const SKILLS: [string, number][] = [
  ['TYPESCRIPT', 0.92], ['REACT / NEXT', 0.9], ['AGENTIC DEV', 0.95],
  ['NODE / .NET', 0.82], ['SQL / DATA', 0.76],
];
