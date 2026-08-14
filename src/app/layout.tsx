import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import { SITE } from "@/data/content";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "Oliver Rasoli · Full Stack Engineer";
const DESCRIPTION = "Full Stack Engineer in Copenhagen. A playable, N64-style developer portfolio with a sculptable 3D head.";

// Person schema, so search engines tie the domain to the human rather than
// guessing from page copy. Rendered as a native <script> per the Next docs.
const PERSON_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Oliver Rasoli",
  jobTitle: "Full Stack Engineer",
  url: "https://rasoli.dk",
  sameAs: [SITE.github, SITE.linkedin].filter(Boolean),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Copenhagen",
    addressCountry: "DK",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rasoli.dk"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pressStart.variable} ${jetbrainsMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(PERSON_JSONLD).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
