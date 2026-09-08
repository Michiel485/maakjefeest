import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Great_Vibes,
  Cormorant_Garamond,
  Pinyon_Script,
  Cinzel,
  Dancing_Script,
  Montserrat,
  Marcellus,
  Lora,
  WindSong,
  Allura,
  Bodoni_Moda,
  Italiana,
  GFS_Didot,
  Prata,
} from "next/font/google";
import Analytics from "@/components/Analytics";
import CookieBanner from "@/components/CookieBanner";
import { MARKETING_URL } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-greatvibes",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

const pinyonScript = Pinyon_Script({
  variable: "--font-pinyonscript",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  preload: false,
  subsets: ["latin"],
  weight: ["400"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  preload: false,
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const lora = Lora({
  variable: "--font-lora",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const windSong = WindSong({
  variable: "--font-windsong",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const allura = Allura({
  variable: "--font-allura",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodonimoda",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "700"],
});

const italiana = Italiana({
  variable: "--font-italiana",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const gfsDidot = GFS_Didot({
  variable: "--font-gfsdidot",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

const prata = Prata({
  variable: "--font-prata",
  preload: false,
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  colorScheme: "only light",
}

const SITE_URL = MARKETING_URL

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SayingYes | Digitale bruiloftswebsite maken",
    template: "%s | SayingYes",
  },
  description: "Maak in minuten een complete digitale bruiloftswebsite met RSVP, fotogalerij en ons verhaal. Geen technische kennis nodig. Eenmalig €49,99.",
  keywords: ["digitale bruiloftswebsite", "trouwkaart online", "bruiloftswebsite maken", "digitale trouwkaart", "online trouwuitnodiging", "RSVP trouwerij", "trouwwebsite"],
  authors: [{ name: "SayingYes", url: SITE_URL }],
  creator: "SayingYes",
  publisher: "SayingYes",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: SITE_URL,
    siteName: "SayingYes",
    title: "SayingYes | Digitale bruiloftswebsite maken",
    description: "Maak in minuten een complete digitale bruiloftswebsite met RSVP, fotogalerij en ons verhaal. Eenmalig €49,99.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SayingYes, digitale bruiloftswebsite maken" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SayingYes | Digitale bruiloftswebsite maken",
    description: "Maak in minuten een complete digitale bruiloftswebsite met RSVP, fotogalerij en ons verhaal. Eenmalig €49,99.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      data-color-scheme="light"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${greatVibes.variable} ${cormorantGaramond.variable} ${pinyonScript.variable} ${cinzel.variable} ${dancingScript.variable} ${montserrat.variable} ${marcellus.variable} ${lora.variable} ${windSong.variable} ${allura.variable} ${bodoniModa.variable} ${italiana.variable} ${gfsDidot.variable} ${prata.variable} h-full antialiased`}
      style={{ colorScheme: "only light" }}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "SayingYes",
                  url: SITE_URL,
                  logo: `${SITE_URL}/og-image.png`,
                  description: "Digitale bruiloftswebsite builder voor bruidsparen in Nederland.",
                  contactPoint: { "@type": "ContactPoint", email: "info@sayingyes.nl", contactType: "customer support", availableLanguage: "Dutch" },
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: "SayingYes",
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  inLanguage: "nl-NL",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "SayingYes",
                  applicationCategory: "WebApplication",
                  operatingSystem: "Web",
                  url: SITE_URL,
                  description: "Maak in minuten een complete digitale bruiloftswebsite met RSVP, fotogalerij, ons verhaal en meer.",
                  offers: { "@type": "Offer", price: "49.99", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
                  inLanguage: "nl-NL",
                },
              ],
            }),
          }}
        />
        {children}
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
