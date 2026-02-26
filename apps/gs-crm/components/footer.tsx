import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto py-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-white/50">
          <div className="flex items-center mb-2 md:mb-0">
            <a href="mailto:gbsullivan@mac.com" className="hover:text-white/80 transition-colors duration-700">
              gbsullivan@mac.com
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-white/80 transition-colors duration-700">
              Privacy Statement
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white/80 transition-colors duration-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}