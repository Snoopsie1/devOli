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
  // Optional square mark shown on the file-select card — a 128px WebP under
  // '/projects/<slug>/icon.webp' for real work, '/secret/<game>.webp' for the
  // hidden files. Decorative — the card already names the project — so it
  // renders with an empty alt. Omit and the card is unchanged.
  icon?: string;
  // Appends a `SECRETS  0 / 1` line to this project's facts. The only hint
  // that the secret exists, so exactly one project carries it.
  secretCounter?: boolean;
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
    secretCounter: true,
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

/* ---------------------------------------------------------------------------
   Konami secret mode.

   Everything below is client-only: it is never rendered on the server and is
   deliberately kept OUT of `PROJECTS` and `SITE`, because `src/app/page.tsx`
   renders those into the crawlable SSR summary. Nothing here should reach a
   search engine — the whole point is that you have to find it.
--------------------------------------------------------------------------- */

/** Identity overrides applied while secret mode is on. Client-side only. */
export const SECRET_SITE: Pick<Site, 'name' | 'subtitle' | 'bio'> = {
  name: 'SNOOPSIE',
  subtitle: 'PLAYER 1 · SINCE THE CARTRIDGE ERA',
  bio: 'Off the clock I go by Snoopsie. Same person, fewer standups. Most of what I know about systems I learned from games that never explained themselves, and most of what I know about probability I paid for in booster packs. Poke the head, it still works.',
};

/**
 * Nominative-use note for the game marks on the hidden files, shown at the
 * foot of the Player Profile in secret mode only — it has no business on the
 * professional side, where no third-party marks appear.
 */
export const SECRET_NOTE = 'GAME MARKS BELONG TO THEIR OWNERS · FAN USE, NO AFFILIATION';

/** Player Profile bars while secret mode is on. Labels max ~12 characters —
 *  the label column is a fixed 120px and anything longer wraps to two lines. */
export const SECRET_SKILLS: [string, number][] = [
  ['DECKBUILDING', 0.88], ['SHOTCALLING', 0.9], ['GAME SENSE', 0.85],
  ['TOUCH GRASS', 0.31], ['BACKLOG', 0.12],
];

/**
 * The hidden file cards, revealed only in secret mode and appended after
 * FILE A / B / C. `num` is `?1`…`?N` rather than letters so they read as
 * locked slots that were always there. One achievement per file — each gets
 * its own mark, title and write-up, exactly like a real project.
 *
 * Names render in ~12px Press Start 2P: no accented characters (there is no É
 * in the face) and keep them to about 34 characters. Fact labels are ~8px and
 * sit three-across on desktop, so max three facts per file. Bodies and fact
 * values are mono and can use anything.
 */
export const SECRET_PROJECTS: Project[] = [
  {
    num: '?1', year: '20XX', name: 'WORLD OF WARCRAFT — ARCANE MAGE',
    blurb: 'The main. Fifteen buttons, one correct order.',
    stack: 'WOW · MMO · PVE', stars: 5, icon: '/secret/wow.webp',
    body: 'Arcane Mage, Draenor EU. The spec that is either the whole meter or a smoking crater, depending on whether you can hold a rotation together while the room is trying to kill you. Most of what I know about reading a system before it explains itself, I learned here.',
    facts: [['MAIN', 'Arcane Mage'], ['REALM', 'Draenor · EU'], ['ROLE', 'Ranged DPS']],
    links: [['RAIDER.IO', 'https://raider.io/characters/eu/draenor/Murkov']],
  },
  {
    num: '?2', year: '20XX', name: 'AHEAD OF THE CURVE',
    blurb: 'The final boss down while it still counted.',
    stack: 'WOW · RAIDING · GUILD', stars: 5, icon: '/secret/wow.webp',
    body: 'Ahead of the Curve across several tiers — the end boss killed before the patch that makes it easy. Twenty people, one fight, weeks of wipes, and the actual skill being the one nobody puts on a CV: showing up on a Wednesday, again, with notes from last Wednesday.',
    facts: [['ACHIEVEMENT', 'Ahead of the Curve'], ['TIERS', 'Several'], ['FORMAT', '20-player heroic']],
  },
  {
    num: '?3', year: '20XX', name: 'POKEMON TCG — REGIONALS',
    blurb: '4010 players. Paper. No undo button.',
    stack: 'POKEMON TCG · PAPER · REGIONALS', stars: 4, icon: '/secret/pokemon.webp',
    body: 'A Regional field of 4010 players, finishing 1666. Nine hours of Swiss where every round is a fresh unknown deck and the only information you get is what your opponent has already been forced to show you. Most of what I know about probability I paid for in booster packs.',
    facts: [['EVENT', 'Regionals'], ['FIELD', '4010 players'], ['FINISH', '1666th']],
  },
  {
    num: '?4', year: '20XX', name: 'ONE PIECE TCG — 2ND OF 40',
    blurb: 'Second place, and the finals went the distance.',
    stack: 'ONE PIECE TCG · LOCALS', stars: 5, icon: '/secret/onepiece.webp',
    body: 'Second of forty at locals in a game young enough that there was no solved list to copy — you built the deck from first principles or you lost to someone who did. Deckbuilding is just API design with a worse error message.',
    facts: [['EVENT', 'Locals'], ['FIELD', '40 players'], ['FINISH', '2nd']],
  },
  {
    num: '?5', year: '20XX', name: 'SMASH ULTIMATE — 2ND AT A MAJOR',
    blurb: 'A major side event, one set from the top.',
    stack: 'SMASH ULTIMATE · FGC · BRACKET', stars: 5, icon: '/secret/smashbros.webp',
    body: 'Second place in a side event at a major. Double elimination, no coaching, no pause — you adapt between stocks or you go home. The fighting game community is the only place I have seen where the person who beats you then explains exactly how they did it.',
    facts: [['EVENT', 'Major · side event'], ['FORMAT', 'Double elimination'], ['FINISH', '2nd']],
  },
  {
    num: '?6', year: '20XX', name: 'OVERWATCH — MASTER SHOTCALLER',
    blurb: 'Master rank, and the voice making the calls.',
    stack: 'OVERWATCH · FPS · IGL', stars: 6, icon: '/secret/overwatch.webp',
    body: 'Master rank, and the one on comms calling it — which is a different job from playing well. You are holding the whole team state in your head, deciding when the fight is worth taking, and being wrong out loud fast enough that everyone can still act on it. Ended up writing the playbook rather than just reading it, and the team won an international cup with it.',
    facts: [['RANK', 'Master'], ['ROLE', 'Shotcaller / IGL'], ['PEAK', 'Won an intl cup']],
  },
  {
    num: '?7', year: '20XX', name: 'DARK SOULS — NG PLUS 12',
    blurb: 'The scaling stops at +6. I did not.',
    stack: 'DARK SOULS · NG+ · SOLO', stars: 6, icon: '/secret/darksouls.webp',
    body: 'Same save, twelve times through. Enemy scaling caps at NG+6, so the last six runs are the same difficulty and purely a question of whether you still want to. Turns out I did. There is no reward screen for this one, which is sort of the point.',
    facts: [['CYCLE', 'NG+12'], ['SCALING CAP', 'NG+6'], ['REWARD', 'None. Correct.']],
  },
];
