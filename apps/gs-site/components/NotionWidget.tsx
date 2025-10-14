'use client';

import { useEffect, useState } from 'react';

interface NotionPage {
  id: string;
  title: string;
  lastEdited: Date;
  url: string;
  icon?: string;
}

export default function NotionWidget() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotionData();
  }, []);

  const fetchNotionData = async () => {
    try {
      const response = await fetch('/api/notion');
      const data = await response.json();

      if (data.connected) {
        setPages(data.pages || []);
        setConnected(true);
      } else {
        setError('Failed to connect to Notion');
        setConnected(false);
      }
    } catch (err) {
      console.error('Error fetching Notion data:', err);
      setError('Failed to fetch Notion data');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !connected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            📝 Notion Integration
          </h2>
          <span className="px-2 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            Disconnected
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {error || 'Unable to connect to Notion. Please check your API key.'}
        </p>
        <button
          onClick={fetchNotionData}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          📝 Notion Second Brain
        </h2>
        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full">
          Connected
        </span>
      </div>

      {pages.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Recent Pages
          </p>
          {pages.map((page) => (
            <a
              key={page.id}
              href={`#`}
              className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {page.icon && (
                  <span className="text-xl">{page.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {page.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last edited: {new Date(page.lastEdited).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </a>
          ))}
          <button className="w-full mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors">
            View All in Notion →
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No pages found. Create some content in Notion to see it here.
          </p>
        </div>
      )}
    </div>
  );
}