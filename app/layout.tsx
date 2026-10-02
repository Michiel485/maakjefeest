import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Analytics from "@/components/Analytics";
import CookieBanner from "@/components/CookieBanner";
import FoutVanger from "@/components/FoutVanger";
import VisitorTracking from "@/components/VisitorTracking";
import { MARKETING_URL } from "@/lib/site-url";
import "./globals.css";

// De lettertypes staan in app/fonts, niet meer bij Google. De build haalde ze
// eerst elke keer bij Google Fonts op en mislukte op 28, 29 en 30 september
// 2026 meerdere keren omdat Google niet op tijd antwoordde (Michiel, 1 oktober
// 2026). Dezelfde bestanden (de latin-set, zoals voorheen), dezelfde namen en
// dezelfde gewichten. Een bereik zoals "300 600" is een variabel lettertype:
// één bestand voor alle diktes.
//
// Niet vooraf laden (preload false) wat alleen een bepaald ontwerp nodig heeft.
// De kaartafbeeldingen (satori) halen hun letters apart op, tijdens het
// draaien; die gaan hier niet langs.

const geistSans = localFont({
  src: "./fonts/geist-var.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-var.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

const playfairDisplay = localFont({
  src: "./fonts/playfair-var.woff2",
  variable: "--font-playfair",
  weight: "400 700",
  display: "swap",
  preload: false,
});

const greatVibes = localFont({
  src: "./fonts/greatvibes-400.woff2",
  variable: "--font-greatvibes",
  weight: "400",
  display: "swap",
  preload: false,
});

const cormorantGaramond = localFont({
  src: "./fonts/cormorant-var.woff2",
  variable: "--font-cormorant",
  weight: "300 600",
  display: "swap",
});

const pinyonScript = localFont({
  src: "./fonts/pinyonscript-400.woff2",
  variable: "--font-pinyonscript",
  weight: "400",
  display: "swap",
  preload: false,
});

const cinzel = localFont({
  src: "./fonts/cinzel-var.woff2",
  variable: "--font-cinzel",
  weight: "400 700",
  display: "swap",
  preload: false,
});

const dancingScript = localFont({
  src: "./fonts/dancing-400.woff2",
  variable: "--font-dancing",
  weight: "400",
  display: "swap",
  preload: false,
});

const montserrat = localFont({
  src: "./fonts/montserrat-var.woff2",
  variable: "--font-montserrat",
  weight: "300 600",
  display: "swap",
  preload: false,
});

const marcellus = localFont({
  src: "./fonts/marcellus-400.woff2",
  variable: "--font-marcellus",
  weight: "400",
  display: "swap",
  preload: false,
});

const lora = localFont({
  src: "./fonts/lora-var.woff2",
  variable: "--font-lora",
  weight: "400 600",
  display: "swap",
  preload: false,
});

const windSong = localFont({
  src: "./fonts/windsong-400.woff2",
  variable: "--font-windsong",
  weight: "400",
  display: "swap",
  preload: false,
});

const allura = localFont({
  src: "./fonts/allura-400.woff2",
  variable: "--font-allura",
  weight: "400",
  display: "swap",
  preload: false,
});

const bodoniModa = localFont({
  src: "./fonts/bodonimoda-var.woff2",
  variable: "--font-bodonimoda",
  weight: "400 700",
  display: "swap",
  preload: false,
});

const italiana = localFont({
  src: "./fonts/italiana-400.woff2",
  variable: "--font-italiana",
  weight: "400",
  display: "swap",
  preload: false,
});

const gfsDidot = localFont({
  src: "./fonts/gfsdidot-400.woff2",
  variable: "--font-gfsdidot",
  weight: "400",
  display: "swap",
  preload: false,
});

const prata = localFont({
  src: "./fonts/prata-400.woff2",
  variable: "--font-prata",
  weight: "400",
  display: "swap",
  preload: false,
});

const allison = localFont({
  src: "./fonts/allison-400.woff2",
  variable: "--font-allison",
  weight: "400",
  display: "swap",
  preload: false,
});

const abrilFatface = localFont({
  src: "./fonts/abril-400.woff2",
  variable: "--font-abril",
  weight: "400",
  display: "swap",
  preload: false,
});

const jost = localFont({
  src: "./fonts/jost-var.woff2",
  variable: "--font-jost",
  weight: "300 500",
  display: "swap",
  preload: false,
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
  description: "Digitale trouwkaart en Save the Date via WhatsApp, met RSVP en een eigen trouwwebsite. Gratis starten, vanaf €15. Geen technische kennis nodig.",
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
    title: "SayingYes | Digitale trouwkaart, Save the Date en trouwwebsite",
    description: "Digitale trouwkaart via WhatsApp, met aanmelden en een eigen trouwwebsite. Gratis ontwerpen, betalen als je verstuurt.",
    // Het deelplaatje komt uit app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "SayingYes | Digitale trouwkaart, Save the Date en trouwwebsite",
    description: "Digitale trouwkaart via WhatsApp, met aanmelden en een eigen trouwwebsite. Gratis ontwerpen, betalen als je verstuurt.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${greatVibes.variable} ${cormorantGaramond.variable} ${pinyonScript.variable} ${cinzel.variable} ${dancingScript.variable} ${montserrat.variable} ${marcellus.variable} ${lora.variable} ${windSong.variable} ${allura.variable} ${bodoniModa.variable} ${italiana.variable} ${gfsDidot.variable} ${prata.variable} ${allison.variable} ${abrilFatface.variable} ${jost.variable} h-full antialiased`}
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
                  description: "Digitale trouwkaart en Save the Date via WhatsApp, RSVP-pagina met dashboard en een complete trouwwebsite met fotogalerij en gastenfotomuur.",
                  offers: {
                    "@type": "AggregateOffer",
                    lowPrice: "15.00",
                    highPrice: "49.99",
                    priceCurrency: "EUR",
                    offerCount: 3,
                    availability: "https://schema.org/InStock",
                  },
                  inLanguage: "nl-NL",
                },
              ],
            }),
          }}
        />
        {children}
        <Analytics />
        <VisitorTracking />
        <CookieBanner />
        <FoutVanger />
      </body>
    </html>
  );
}
