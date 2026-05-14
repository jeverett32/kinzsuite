import type { Metadata, Viewport } from "next";
import { Fredoka, Lilita_One, Caveat } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});
const lilita = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lilita",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "KinzSuite — pet companion for two",
  description: "A cozy shared world for you, your partner, and your pets.",
  applicationName: "KinzSuite",
  icons: {
    icon: [
      { url: "/icon.webp", type: "image/webp", sizes: "512x512" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "KinzSuite",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#3FB8E8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${lilita.variable} ${caveat.variable}`}
    >
      <body className="font-body min-h-[100dvh]">{children}</body>
    </html>
  );
}
