'use client'

import { useEffect, useState } from 'react'

export default function AuthLoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Verifying authentication...')

  useEffect(() => {
    // Simulate progress over 2 seconds
    const startTime = Date.now()
    const duration = 2000 // 2 seconds total
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)

      // Update message based on progress
      if (newProgress < 30) {
        setMessage('Verifying authentication...')
      } else if (newProgress < 60) {
        setMessage('Loading your profile...')
      } else if (newProgress < 90) {
        setMessage('Preparing preferences form...')
      } else {
        setMessage('Almost ready...')
      }

      if (newProgress >= 100) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <img src="/assets/logo.png" alt="Wabbit Logo" className="h-12 w-auto mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Setting Up Your Account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {message}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Loading</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Info Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              This may take a few seconds while we prepare your personalized experience
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}