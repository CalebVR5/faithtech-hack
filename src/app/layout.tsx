import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/components/app-state";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// The same bundled fonts the card and video renderers use, served locally:
// no request to a font CDN, and the preview matches the export.
const sans = localFont({
  src: [
    { path: "../../assets/fonts/AtkinsonHyperlegible-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../assets/fonts/AtkinsonHyperlegible-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  display: "swap",
});

// Reserved for the storyteller's own words.
const story = localFont({
  src: [{ path: "../../assets/fonts/Literata-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Share your story",
  description: "Tell your baptism story or your testimony in your own words and choose who receives it.",
  // Story content must never be indexed or previewed by crawlers.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E4A55",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${story.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProvider>
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-6 pb-16">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
