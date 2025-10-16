import Link from "next/link";
import NotionWidget from '@/components/NotionWidget';

export default function Home() {
  const apps = [
    {
      id: 'crm',
      title: 'Cursor MY MAP CRM',
      description: 'Customer relationship management system',
      href: '/crm',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      icon: '📊'
    },
    {
      id: 'wabbit-re',
      title: 'Wabbit RE',
      description: 'Real estate property ranking platform',
      href: 'http://localhost:3000/wabbit-re',
      external: true,
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      icon: '🏠'
    },
    {
      id: 'wabbit',
      title: 'Wabbit',
      description: 'General-purpose ranking platform',
      href: 'http://localhost:3002/wabbit',
      external: true,
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      icon: '⭐'
    },
    {
      id: 'notion',
      title: 'Notion Integration',
      description: 'Second brain knowledge base',
      href: '#',
      bgColor: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
      icon: '📝',
      comingSoon: false,
      integrated: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            GS Site Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Personal app suite and launcher
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div key={app.id} className="relative group">
              {app.external ? (
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 ${
                    app.comingSoon
                      ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
                      : `${app.bgColor} ${app.hoverColor} text-white`
                  }`}
                >
                  <AppTileContent app={app} />
                </a>
              ) : app.comingSoon ? (
                <div
                  className={`block p-6 rounded-lg shadow-lg transition-all duration-200 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60`}
                >
                  <AppTileContent app={app} />
                </div>
              ) : (
                <Link
                  href={app.href}
                  className={`block p-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 ${app.bgColor} ${app.hoverColor} text-white`}
                >
                  <AppTileContent app={app} />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats & Notion Integration */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active Apps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Coming Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Uptime</div>
              </div>
            </div>
          </div>

          {/* Notion Integration Widget */}
          <NotionWidget />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 dark:text-gray-300">
            © 2025 GS Site - Personal App Suite
          </p>
        </div>
      </footer>
    </div>
  );
}

function AppTileContent({ app }: { app: any }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{app.icon}</span>
        {app.external && !app.comingSoon && (
          <svg
            className="w-5 h-5 opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {app.title}
        {app.comingSoon && (
          <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">
            Coming Soon
          </span>
        )}
        {app.integrated && (
          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
            Integrated
          </span>
        )}
      </h3>
      <p className={app.comingSoon ? "text-gray-600 dark:text-gray-400" : "text-white/90"}>
        {app.description}
      </p>
    </>
  );
}