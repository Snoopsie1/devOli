// Real portfolio content for Oliver Rasoli. A few fields are best-effort and
// flagged for the owner to confirm (Gymie's year, skill percentages are
// self-ratings). No data fetching — static arrays.

/**
 * One real screenshot of a project. Files live under `public/projects/<slug>/`
 * as pre-resized WebP; `width`/`height` are the intrinsic pixel dimensions of
 * the file on disk and must be accurate — the gallery reserves space with them
 * so the detail panel does not jump while images load.
 */
export interface Screenshot {
  src: string;
  alt: string;
  width: number;
  height: number;
  orientation: 'desktop' | 'mobile';
  caption: string; // shown under the image in the lightbox, ALL-CAPS
}

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
  // Optional. Omit and the detail panel renders exactly as it did before.
  screenshots?: Screenshot[];
  // Optional square mark shown on the file-select card, e.g.
  // '/projects/<slug>/icon.webp'. Decorative — the card already names the
  // project — so it renders with an empty alt. Omit and the card is unchanged.
  icon?: string;
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
    icon: '/projects/gymie/icon.webp',
    screenshots: [
      {
        src: '/projects/gymie/home-desktop.webp', width: 1600, height: 791, orientation: 'desktop',
        alt: 'Gymie home screen on desktop: a yellow mascot banner, a Start Training button, workout counters, and a list of recent sessions beside a left sidebar.',
        caption: 'HOME · DESKTOP',
      },
      {
        src: '/projects/gymie/home-mobile.webp', width: 396, height: 859, orientation: 'mobile',
        alt: 'Gymie home screen on a phone: the same banner and counters stacked vertically above recent workouts, with a bottom tab bar.',
        caption: 'HOME · MOBILE',
      },
      {
        src: '/projects/gymie/start-workout-mobile.webp', width: 396, height: 861, orientation: 'mobile',
        alt: 'Gymie workout setup on a phone, asking what you are training today with selectable muscle-group chips.',
        caption: 'START A WORKOUT',
      },
      {
        src: '/projects/gymie/exercise-pool-mobile.webp', width: 397, height: 865, orientation: 'mobile',
        alt: 'Gymie live workout on a phone: a Lat Pulldown card with logged sets and weight and rep steppers, above a pool of suggested exercises.',
        caption: 'LOGGING SETS',
      },
      {
        src: '/projects/gymie/history-mobile.webp', width: 393, height: 864, orientation: 'mobile',
        alt: 'Gymie history on a phone, grouping past workouts by week with muscle-group tags and set and volume totals.',
        caption: 'HISTORY',
      },
    ],
  },
  {
    num: 'B', year: '2026', name: 'DEV 64 — THIS PORTFOLIO',
    blurb: 'The sculptable low-poly head you are holding.',
    stack: 'NEXT.JS · THREE.JS · TS', stars: 5,
    body: 'A single-page portfolio styled as an N64 title screen. The head is a real-time three.js mesh you can drag to deform and spring back with a wobble, about 400 lines of vertex-weighted soft-body math. Built with an agent-driven workflow.',
    facts: [['ROLE', 'Solo build'], ['PARTS', '44 meshes'], ['BUILD', 'Agent-driven']],
    links: [['LIVE', 'https://rasoli.dk'], ['CODE', 'https://github.com/Snoopsie1/devOli']],
    icon: '/projects/dev64/icon.webp',
  },
  {
    num: 'C', year: '2024', name: 'FRUGAL — SHOP SMARTER',
    blurb: 'Where does this basket actually cost least?',
    stack: 'FIGMA · UX RESEARCH', stars: 4,
    body: 'Danish supermarkets all run different deals in the same week, so the cheapest basket is never the cheapest store. Frugal takes a shopping list and prices the whole basket at Netto, Lidl, Rema 1000 and the rest, so you can see what one trip costs everywhere, or what a run between stores would actually save. The list builds itself into a paper receipt as you type, and the same receipt becomes the answer. A team concept for school, taken to a clickable prototype.',
    facts: [['ROLE', 'Team project'], ['SCOPE', 'Clickable prototype'], ['STATUS', 'Concept, not shipped']],
    icon: '/projects/frugal/icon.webp',
    screenshots: [
      {
        src: '/projects/frugal/logo.webp', width: 232, height: 186, orientation: 'desktop',
        alt: 'The Frugal logo: a line-drawn basket of green grapes and a yellow pear with a leaf, above the lowercase wordmark "frugal".',
        caption: 'THE MARK',
      },
      {
        src: '/projects/frugal/empty-state.webp', width: 247, height: 547, orientation: 'mobile',
        alt: 'Frugal opening screen: the logo above a single "Add to shopping list" field with a plus button, over a large faded basket watermark.',
        caption: 'ONE FIELD, NOTHING ELSE',
      },
      {
        src: '/projects/frugal/first-item.webp', width: 236, height: 530, orientation: 'mobile',
        alt: 'Frugal after adding one item: a paper receipt has appeared below the input listing APPLE with a placeholder price, a prompt to find the best price, and a barcode.',
        caption: 'THE LIST IS A RECEIPT',
      },
      {
        src: '/projects/frugal/two-items.webp', width: 233, height: 526, orientation: 'mobile',
        alt: 'The Frugal receipt with two items, BANANA and APPLE, each with a placeholder price.',
        caption: 'ADDING ITEMS',
      },
      {
        src: '/projects/frugal/full-list.webp', width: 229, height: 523, orientation: 'mobile',
        alt: 'A fuller Frugal receipt listing hat, hat, glasses, cucumber, banana and apple, with the arrow prompt to price the basket.',
        caption: 'READY TO PRICE',
      },
      {
        src: '/projects/frugal/store-comparison.webp', width: 190, height: 914, orientation: 'mobile',
        alt: 'Three stacked Frugal receipts comparing the same basket at Netto, Lidl and Rema 1000, each itemised with its own total.',
        caption: 'THE SAME BASKET, EVERY STORE',
      },
      {
        src: '/projects/frugal/cheapest-store.webp', width: 193, height: 426, orientation: 'mobile',
        alt: 'The winning Netto receipt on its own, showing the cheapest total for the basket and an option to save the list.',
        caption: 'THE CHEAPEST BASKET',
      },
      {
        src: '/projects/frugal/shopping-checklist.webp', width: 198, height: 437, orientation: 'mobile',
        alt: 'The Netto receipt used as an in-store checklist, with every item struck through as it is picked up.',
        caption: 'TICK IT OFF IN THE AISLE',
      },
    ],
  },
];

// Self-rated 0–1. Owner should tune the numbers. AGENTIC DEV umbrellas
// AI-assisted / agent-driven development (parallel worktrees, agent workflows).
export const SKILLS: [string, number][] = [
  ['TYPESCRIPT', 0.92], ['REACT / NEXT', 0.9], ['AGENTIC DEV', 0.95],
  ['NODE / .NET', 0.82], ['SQL / DATA', 0.76],
];
