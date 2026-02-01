import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://growthadvisory.ai'),
  title: "Growth Advisory | AI-Driven Growth for SMBs",
  description: "Provide SMBs with bleeding edge tooling insights, as well as development of custom solutions for their edge cases to facilitate growth, empowering operator's domain expertise with AI.",
  openGraph: {
    title: 'Growth Advisory | AI-Driven Growth for SMBs',
    description: 'Custom AI solutions, operations automation, and full-stack development for growing businesses.',
    type: 'website',
    url: 'https://growthadvisory.ai',
    siteName: 'Growth Advisory',
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
