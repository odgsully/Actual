import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import Footer from '@/components/footer'
import EthereumPolyfill from './ethereum-polyfill'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wabbit - Smart Real Estate Discovery',
  description: 'Find your perfect home with intelligent property matching and collaborative ranking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <EthereumPolyfill />
            <div className="min-h-screen flex flex-col">
              {children}
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}