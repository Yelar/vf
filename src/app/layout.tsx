import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Anton, Oswald, Bangers, Fredoka, Montserrat } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Video font options
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const bangers = Bangers({
  variable: "--font-bangers",
  subsets: ["latin"],
  weight: "400",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "VFS - AI Video Studio",
  description: "Create viral YouTube Shorts, TikToks, and Instagram Reels with AI-powered content generation, premium voice synthesis, and professional video rendering.",
  keywords: "AI video, YouTube Shorts, TikTok, Instagram Reels, video generator, AI content, voice synthesis",
  authors: [{ name: "VFS Team" }],
  creator: "VFS",
  publisher: "VFS",
  openGraph: {
    title: "VFS - AI Video Studio",
    description: "Create viral videos with AI-powered content generation",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VFS - AI Video Studio",
    description: "Create viral videos with AI-powered content generation",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8b5cf6",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${oswald.variable} ${bangers.variable} ${fredoka.variable} ${montserrat.variable} antialiased bg-black text-white`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
