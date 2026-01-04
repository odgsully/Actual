'use client';

import { useRef, useCallback, useState } from 'react';
import {
  X,
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Upload,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCallLog } from '@/hooks/useCallLogStats';
import { formatPhoneNumber, formatDuration } from '@/lib/calllog/types';
import type { CallEntryFormatted, CallLogWeeklyFormatted } from '@/lib/calllog/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CallLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CallLogModal - Full detail view for call log statistics
 *
 * Features:
 * - Upload call log screenshots (Verizon app or iPhone Recents)
 * - View weekly statistics and trends
 * - See recent calls with contact info
 * - Top contacts by call frequency
 */
export function CallLogModal({ isOpen, onClose }: CallLogModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const {
    currentWeek,
    previousWeeks,
    recentCalls,
    hasData,
    isLoading,
    isError,
    upload,
    isUploading,
    refetch,
  } = useCallLog();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      upload(
        { files: Array.from(files) },
        {
          onSuccess: () => {
            toast.success('Screenshot uploaded', {
              description: 'Processing call data...',
            });
            // Refetch after a delay to allow processing
            setTimeout(() => refetch(), 3000);
          },
          onError: (error) => {
            toast.error('Upload failed', {
              description: error.message,
            });
          },
        }
      );

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, refetch]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Call Log</h2>
              <p className="text-sm text-muted-foreground">
                Weekly call statistics and history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Refresh"
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('w-4 h-4', isLoading && 'animate-spin')}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Section */}
          <div className="bg-muted/30 rounded-xl p-6 border border-dashed border-muted-foreground/30">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">Upload Call Log Screenshot</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Screenshot your Verizon app or iPhone Recents to track calls
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'px-6 py-2 bg-primary text-primary-foreground rounded-lg',
                  'hover:bg-primary/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isUploading ? 'Uploading...' : 'Select Screenshot'}
              </button>
            </div>
          </div>

          {/* Current Week Stats */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-muted/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load call data</p>
            </div>
          ) : hasData && currentWeek ? (
            <>
              {/* Week Label */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">This Week</h3>
                <span className="text-sm text-muted-foreground">
                  {currentWeek.weekLabel}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<PhoneOutgoing className="w-5 h-5 text-green-500" />}
                  label="Outbound"
                  value={currentWeek.outboundCount}
                  subValue={`${currentWeek.dailyAvgOutbound.toFixed(1)}/day avg`}
                  color="green"
                />
                <StatCard
                  icon={<PhoneIncoming className="w-5 h-5 text-blue-500" />}
                  label="Inbound"
                  value={currentWeek.inboundCount}
                  subValue={`${currentWeek.dailyAvgInbound.toFixed(1)}/day avg`}
                  color="blue"
                />
                <StatCard
                  icon={<PhoneMissed className="w-5 h-5 text-red-500" />}
                  label="Missed"
                  value={currentWeek.missedCount}
                  color="red"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5 text-purple-500" />}
                  label="Total Duration"
                  value={currentWeek.totalDuration}
                  subValue={`${currentWeek.avgCallDuration} avg`}
                  color="purple"
                />
              </div>

              {/* Week over week change */}
              {currentWeek.weekOverWeekChange !== null && (
                <div className="flex items-center gap-2 text-sm">
                  {currentWeek.weekOverWeekChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      currentWeek.weekOverWeekChange >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {currentWeek.weekOverWeekChange > 0 ? '+' : ''}
                    {currentWeek.weekOverWeekChange}% from last week
                  </span>
                </div>
              )}

              {/* Top Contacts */}
              {currentWeek.topContacts && currentWeek.topContacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Top Contacts
                  </h4>
                  <div className="space-y-2">
                    {currentWeek.topContacts.slice(0, 5).map((contact, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {contact.name || formatPhoneNumber(contact.phoneNumber)}
                            </p>
                            {contact.name && (
                              <p className="text-xs text-muted-foreground">
                                {formatPhoneNumber(contact.phoneNumber)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {contact.callCount} calls
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.totalDuration}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Calls */}
              {recentCalls && recentCalls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Recent Calls
                  </h4>
                  <div className="space-y-1">
                    {recentCalls.slice(0, 10).map((call, i) => (
                      <CallRow key={i} call={call} />
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Weeks History */}
              {previousWeeks && previousWeeks.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showHistory ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    Previous Weeks ({previousWeeks.length})
                  </button>

                  {showHistory && (
                    <div className="mt-3 space-y-3">
                      {previousWeeks.map((week, i) => (
                        <WeekSummary key={i} week={week} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No call data yet</p>
              <p className="text-sm mt-1">
                Upload a screenshot of your call log to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: 'green' | 'blue' | 'red' | 'purple';
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  const bgColors = {
    green: 'bg-green-500/10',
    blue: 'bg-blue-500/10',
    red: 'bg-red-500/10',
    purple: 'bg-purple-500/10',
  };

  return (
    <div className={cn('rounded-lg p-4', bgColors[color])}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}

function CallRow({ call }: { call: CallEntryFormatted }) {
  const DirectionIcon = {
    outgoing: PhoneOutgoing,
    incoming: PhoneIncoming,
    missed: PhoneMissed,
  }[call.direction];

  const directionColors = {
    outgoing: 'text-green-500',
    incoming: 'text-blue-500',
    missed: 'text-red-500',
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <DirectionIcon className={cn('w-4 h-4', directionColors[call.direction])} />
        <div>
          <p className="font-medium text-sm">
            {call.contactName || formatPhoneNumber(call.phoneNumber)}
          </p>
          <p className="text-xs text-muted-foreground">{call.dateLabel}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">{call.duration}</p>
      </div>
    </div>
  );
}

function WeekSummary({ week }: { week: CallLogWeeklyFormatted }) {
  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{week.weekLabel}</span>
        <span className="text-sm text-muted-foreground">
          {week.totalCalls} calls
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-600">{week.outboundCount} out</span>
        <span className="text-blue-600">{week.inboundCount} in</span>
        <span className="text-red-600">{week.missedCount} missed</span>
        <span className="text-muted-foreground">{week.totalDuration}</span>
      </div>
    </div>
  );
}

export default CallLogModal;
