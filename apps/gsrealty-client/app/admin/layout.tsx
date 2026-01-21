'use client'

import { useAuth } from '@/hooks/useAuth'
import { BRAND } from '@/lib/constants/branding'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel'
import { CreateEventModal } from '@/components/admin/CreateEventModal'
import LogOutreachModal from '@/components/admin/LogOutreachModal'
import {
  Home,
  Upload,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Briefcase,
  MessageSquare,
  Database,
  BarChart3,
  Zap,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reportsExpanded, setReportsExpanded] = useState(false)
  const [kpisExpanded, setKpisExpanded] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false)
  const [outreachDefaultType, setOutreachDefaultType] = useState<'call' | 'email' | 'meeting' | 'text' | 'other'>('call')

  // Main Menu navigation items
  const mainMenuItems = [
    { name: 'Contacts', href: '/admin/clients', icon: Users, active: true },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
    { name: 'Sales Pipeline', href: '/admin/pipeline', icon: DollarSign },
    { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
    { name: 'Learn', href: '/admin/learn', icon: BookOpen },
    { name: 'Campaigns', href: '#', icon: Target, disabled: true },
  ]

  // Reports dropdown items (nested under CRM Tools)
  const reportsItems = [
    { name: 'ReportIt', href: '/admin/reportit', icon: FileText },
    { name: 'MCAO Lookup', href: '/admin/mcao', icon: Search },
    { name: 'Upload MLS', href: '/admin/upload', icon: Upload },
  ]

  // KPIs dropdown items (nested under CRM Tools)
  const kpisItems = [
    { name: 'Metrics', href: '/admin/kpis/metrics', icon: TrendingUp },
    { name: 'Campaign Spend', href: '/admin/kpis/campaign-spend', icon: DollarSign },
  ]

  // Other CRM Tools (placeholders)
  const crmToolsItems = [
    { name: 'Deals', href: '/admin/deals', icon: Briefcase },
    { name: 'Messages', href: '#', icon: MessageSquare, disabled: true },
    { name: 'Data Import', href: '#', icon: Database, disabled: true },
  ]

  // Administration items
  const adminItems = [
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Automations', href: '#', icon: Zap, disabled: true },
  ]

  // Legacy navigation array for mobile compatibility
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Contacts', href: '/admin/clients', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
    { name: 'Sales Pipeline', href: '/admin/pipeline', icon: DollarSign },
    { name: 'Learn', href: '/admin/learn', icon: BookOpen },
    { name: 'Deals', href: '/admin/deals', icon: Briefcase },
    { name: 'ReportIt', href: '/admin/reportit', icon: FileText },
    { name: 'MCAO Lookup', href: '/admin/mcao', icon: Search },
    { name: 'Upload MLS', href: '/admin/upload', icon: Upload },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  // Quick actions for right sidebar (used on dashboard)
  const quickActions = [
    {
      title: 'Add New Client',
      description: 'Create a new client profile',
      icon: User,
      href: '/admin/clients/new',
      color: 'bg-brand-black'
    },
    {
      title: 'Upload MLS Data',
      description: 'Process MLS comps and generate reports',
      icon: Upload,
      href: '/admin/upload',
      color: 'bg-brand-red'
    },
    {
      title: 'MCAO Property Search',
      description: 'Look up Maricopa County property data',
      icon: Search,
      href: '/admin/mcao',
      color: 'bg-brand-black'
    },
    {
      title: 'System Settings',
      description: 'Configure app preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-700'
    },
  ]

  const handleLogOutreach = (type: 'call' | 'email' | 'meeting' | 'text' | 'other') => {
    setOutreachDefaultType(type)
    setIsOutreachModalOpen(true)
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isDashboard = pathname === '/admin'

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/crm-background.jpg)' }}
      />
      {/* Dark Overlay */}
      <div className="bg-black/30 absolute inset-0" />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Slide-in) */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-brand-black text-white
          transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Logo - Clickable to return to dashboard */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={BRAND.logo}
              alt={BRAND.logoAlt}
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold">{BRAND.name}</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
          {/* Main Menu */}
          <div>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-4">Main Menu</h4>
            <div className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const isDisabled = item.disabled

                if (isDisabled) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed opacity-50"
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-colors
                      ${active
                        ? 'bg-brand-red text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* CRM Tools */}
          <div>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-4">CRM Tools</h4>
            <div className="space-y-1">
              {/* Reports Dropdown */}
              <button
                onClick={() => setReportsExpanded(!reportsExpanded)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                  ${reportsItems.some(item => isActive(item.href))
                    ? 'bg-brand-red text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <span className="flex items-center">
                  <FileText className="w-5 h-5 mr-3" />
                  <span className="font-medium">Reports</span>
                </span>
                {reportsExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Reports Sub-items */}
              {reportsExpanded && (
                <div className="ml-4 space-y-1 border-l border-gray-700 pl-3">
                  {reportsItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center px-4 py-2 rounded-lg transition-colors text-sm
                          ${active
                            ? 'bg-brand-red text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* KPIs Dropdown */}
              <button
                onClick={() => setKpisExpanded(!kpisExpanded)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                  ${kpisItems.some(item => isActive(item.href))
                    ? 'bg-brand-red text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <span className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-3" />
                  <span className="font-medium">KPIs</span>
                </span>
                {kpisExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* KPIs Sub-items */}
              {kpisExpanded && (
                <div className="ml-4 space-y-1 border-l border-gray-700 pl-3">
                  {kpisItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center px-4 py-2 rounded-lg transition-colors text-sm
                          ${active
                            ? 'bg-brand-red text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Other CRM Tools */}
              {crmToolsItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const isDisabled = item.disabled

                if (isDisabled) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed opacity-50"
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-colors
                      ${active
                        ? 'bg-brand-red text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Administration */}
          <div>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-4">Administration</h4>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const isDisabled = item.disabled

                if (isDisabled) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed opacity-50"
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg transition-colors
                      ${active
                        ? 'bg-brand-red text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Mobile User/Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800 rounded-lg mb-2">
            <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop 3-Column Grid */}
      <div className="relative z-10 p-6 hidden lg:grid grid-cols-12 gap-6 min-h-screen">
        {/* Left Sidebar - col-span-2 */}
        <Card className="col-span-2 glass-card p-6 h-fit flex flex-col">
          <div className="space-y-6">
            {/* Logo - Clickable to return to dashboard */}
            <div className="text-center">
              <Link href="/admin" className="block hover:opacity-80 transition-opacity">
                <img
                  src={BRAND.logo}
                  alt={BRAND.logoAlt}
                  className="h-12 w-auto mx-auto mb-2"
                />
              </Link>
              <Link href="/admin" className="block hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold text-white">{BRAND.name}</h1>
              </Link>
              <p className="text-white/60 text-sm">Admin Panel</p>
            </div>

            {/* Main Menu */}
            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Main Menu</h4>
              <nav className="space-y-2">
                {mainMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const isDisabled = item.disabled

                  if (isDisabled) {
                    return (
                      <Button
                        key={item.name}
                        variant="ghost"
                        disabled
                        className="glass-nav-item opacity-50 cursor-not-allowed"
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Button>
                    )
                  }

                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      asChild
                      className={`glass-nav-item ${active ? 'glass-nav-active' : ''}`}
                    >
                      <Link href={item.href} className="inline-flex items-center w-full">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </Button>
                  )
                })}
              </nav>
            </div>

            {/* CRM Tools */}
            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">CRM Tools</h4>
              <nav className="space-y-2">
                {/* Reports Dropdown */}
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setReportsExpanded(!reportsExpanded)}
                    className={`glass-nav-item justify-between ${
                      reportsItems.some(item => isActive(item.href)) ? 'glass-nav-active' : ''
                    }`}
                  >
                    <span className="flex items-center">
                      <FileText className="mr-3 h-5 w-5" />
                      Reports
                    </span>
                    {reportsExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Reports Sub-items */}
                  {reportsExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                      {reportsItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                          <Button
                            key={item.name}
                            variant="ghost"
                            asChild
                            className={`glass-nav-item h-9 text-sm ${active ? 'glass-nav-active' : ''}`}
                          >
                            <Link href={item.href} className="inline-flex items-center w-full">
                              <Icon className="mr-3 h-4 w-4" />
                              {item.name}
                            </Link>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* KPIs Dropdown */}
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setKpisExpanded(!kpisExpanded)}
                    className={`glass-nav-item justify-between ${
                      kpisItems.some(item => isActive(item.href)) ? 'glass-nav-active' : ''
                    }`}
                  >
                    <span className="flex items-center">
                      <BarChart3 className="mr-3 h-5 w-5" />
                      KPIs
                    </span>
                    {kpisExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {/* KPIs Sub-items */}
                  {kpisExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
                      {kpisItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                          <Button
                            key={item.name}
                            variant="ghost"
                            asChild
                            className={`glass-nav-item h-9 text-sm ${active ? 'glass-nav-active' : ''}`}
                          >
                            <Link href={item.href} className="inline-flex items-center w-full">
                              <Icon className="mr-3 h-4 w-4" />
                              {item.name}
                            </Link>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Other CRM Tools */}
                {crmToolsItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const isDisabled = item.disabled

                  if (isDisabled) {
                    return (
                      <Button
                        key={item.name}
                        variant="ghost"
                        disabled
                        className="glass-nav-item opacity-50 cursor-not-allowed"
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Button>
                    )
                  }

                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      asChild
                      className={`glass-nav-item ${active ? 'glass-nav-active' : ''}`}
                    >
                      <Link href={item.href} className="inline-flex items-center w-full">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </Button>
                  )
                })}
              </nav>
            </div>

            {/* Administration */}
            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Administration</h4>
              <nav className="space-y-2">
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const isDisabled = item.disabled

                  if (isDisabled) {
                    return (
                      <Button
                        key={item.name}
                        variant="ghost"
                        disabled
                        className="glass-nav-item opacity-50 cursor-not-allowed"
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Button>
                    )
                  }

                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      asChild
                      className={`glass-nav-item ${active ? 'glass-nav-active' : ''}`}
                    >
                      <Link href={item.href} className="inline-flex items-center w-full">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </Button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 space-y-2 pt-4 mt-6 border-t border-white/10">
            <Button
              variant="ghost"
              className="glass-nav-item"
            >
              <HelpCircle className="mr-3 h-5 w-5" />
              Contact Support
            </Button>
            <Button
              variant="ghost"
              onClick={signOut}
              className="glass-nav-item"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </Card>

        {/* Main Content - col-span-8 or col-span-10 */}
        <div className={`${isDashboard ? 'col-span-8' : 'col-span-10'} space-y-6 overflow-y-auto max-h-screen pb-6`}>
          {children}
        </div>

        {/* Right Sidebar - col-span-2 (Dashboard only) */}
        {isDashboard && (
          <Card className="col-span-2 glass-card p-6 h-fit">
            <QuickActionsPanel
              quickActions={quickActions}
              onBookMeeting={() => setIsEventModalOpen(true)}
              onLogOutreach={handleLogOutreach}
            />
          </Card>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="relative z-10 lg:hidden">
        {/* Mobile Top Bar */}
        <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-white/80 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white/60">{user?.email?.split('@')[0]}</span>
              <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Page Content */}
        <main className="p-4">
          {children}
        </main>
      </div>

      {/* Event Creation Modal - Triggered by Book Meeting quick action */}
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventCreated={() => {
          console.log('Event created successfully')
          setIsEventModalOpen(false)
        }}
      />

      {/* Outreach Logging Modal - Triggered by Log Call/Email quick actions */}
      <LogOutreachModal
        isOpen={isOutreachModalOpen}
        onClose={() => setIsOutreachModalOpen(false)}
        defaultType={outreachDefaultType}
        onSuccess={() => {
          console.log('Outreach logged successfully')
        }}
      />
    </div>
  )
}
