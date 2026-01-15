'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  Mail,
  Calendar,
  Plus,
  LucideIcon
} from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
}

interface QuickActionsPanelProps {
  quickActions?: QuickAction[]
  onBookMeeting?: () => void
}

export function QuickActionsPanel({ quickActions, onBookMeeting }: QuickActionsPanelProps) {
  // Default quick actions matching template style
  const defaultActions = [
    { icon: Phone, label: 'Schedule Call', href: '#' },
    { icon: Mail, label: 'Send Email', href: 'mailto:' },
    { icon: Calendar, label: 'Book Meeting', href: '#', onClick: onBookMeeting },
    { icon: Plus, label: 'Add Note', href: '#' },
  ]

  // Recent activity data (would be dynamic in production)
  const recentActivity = [
    { action: 'New contact added', time: '2 min ago', type: 'success' },
    { action: 'Deal closed', time: '1 hour ago', type: 'success' },
    { action: 'Meeting scheduled', time: '3 hours ago', type: 'info' },
    { action: 'Email sent', time: '5 hours ago', type: 'default' },
  ]

  // Top performers data (mock data)
  const topPerformers = [
    { name: 'Alex Smith', deals: 12, avatar: 'AS' },
    { name: 'Maria Garcia', deals: 9, avatar: 'MG' },
    { name: 'John Doe', deals: 7, avatar: 'JD' },
  ]

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="space-y-2">
          {defaultActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02]"
                onClick={action.onClick}
                asChild={!action.onClick}
              >
                {action.onClick ? (
                  <>
                    <Icon className="mr-3 h-4 w-4" />
                    {action.label}
                  </>
                ) : (
                  <a href={action.href} className="inline-flex items-center">
                    <Icon className="mr-3 h-4 w-4" />
                    {action.label}
                  </a>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
              <div
                className={`w-2 h-2 rounded-full ${
                  activity.type === 'success'
                    ? 'bg-green-400'
                    : activity.type === 'info'
                      ? 'bg-blue-400'
                      : 'bg-white/60'
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-white">{activity.action}</p>
                <p className="text-xs text-white/60">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
        <div className="space-y-3">
          {topPerformers.map((performer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white/20 text-white text-xs">
                    {performer.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">{performer.name}</p>
                  <p className="text-xs text-white/60">{performer.deals} deals</p>
                </div>
              </div>
              <Badge className="bg-white/10 text-white border-white/20">
                #{index + 1}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
