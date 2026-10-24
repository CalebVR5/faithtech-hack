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

const serif = localFont({
  src: [{ path: "../../assets/fonts/LibreBaskerville.ttf", style: "normal" }],
  variable: "--font-baskerville",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Share your baptism story (prototype)",
  description: "Hackathon prototype. Test data only.",
  // Story content must never be indexed or previewed by crawlers.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F2B36",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProvider>
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-6 pb-16">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
