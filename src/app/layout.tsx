import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Resonance — the soundtrack of your life",
  description:
    "Rediscover the music that shaped you. Resonance reconstructs the songs from your place and time and builds a playlist on your Spotify.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
