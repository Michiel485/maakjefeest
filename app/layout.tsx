import type { Metadata } from "next";
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
} from "next/font/google";
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
  subsets: ["latin"],
  weight: ["400", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-greatvibes",
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
  subsets: ["latin"],
  weight: "400",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const windSong = WindSong({
  variable: "--font-windsong",
  subsets: ["latin"],
  weight: "400",
});

const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: "400",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodonimoda",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Saying Yes — Jullie bruiloftswebsite",
  description: "Bouw in minuten een prachtige bruiloftswebsite. Eenmalig €39,99 voor een jaar. Deel het programma, verzamel RSVP's en beheer alles in jullie dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${greatVibes.variable} ${cormorantGaramond.variable} ${pinyonScript.variable} ${cinzel.variable} ${dancingScript.variable} ${montserrat.variable} ${marcellus.variable} ${lora.variable} ${windSong.variable} ${allura.variable} ${bodoniModa.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
