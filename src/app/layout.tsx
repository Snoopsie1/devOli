import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://rasoli.dk"),
  title: TITLE,
  description: DESCRIPTION,
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
      <body>{children}</body>
    </html>
  );
}
