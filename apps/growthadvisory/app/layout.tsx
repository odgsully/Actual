import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://growthadvisory.ai'),
  title: "Growth Advisory | AI-Driven Growth for SMBs",
  description: "Custom AI solutions, operations automation, and full-stack development for growing businesses. Empower your domain expertise with intelligent systems.",
  openGraph: {
    title: 'Growth Advisory | AI-Driven Growth for SMBs',
    description: 'Custom AI solutions, RevOps, and full-stack development for growing businesses.',
    type: 'website',
    url: 'https://growthadvisory.ai',
    siteName: 'Growth Advisory',
    // TODO: Add og-image.png to /public/assets/
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Growth Advisory | AI-Driven Growth for SMBs',
    description: 'Custom AI solutions, operations automation, and full-stack development for growing businesses.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
