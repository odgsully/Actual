import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-2 md:mb-0">
            <a href="mailto:support@wabbit-rank.ai" className="hover:text-gray-700 dark:hover:text-gray-300">
              support@wabbit-rank.ai
            </a>
            <span className="hidden md:inline">•</span>
            <a href="mailto:gbsullivan@mac.com" className="hover:text-gray-700 dark:hover:text-gray-300">
              gbsullivan@mac.com
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">
              Privacy Statement
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}