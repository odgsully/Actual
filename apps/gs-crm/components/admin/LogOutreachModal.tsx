/**
 * Log Outreach Modal Component
 * Admin component to log calls, emails, meetings, and other client interactions
 */

'use client';

import { useState, useEffect } from 'react';
import { getAllClients, type GSRealtyClient } from '@/lib/database/clients';
import {
  Phone,
  Mail,
  Users,
  MessageSquare,
  MoreHorizontal,
  X,
  Clock,
  CheckCircle2
} from 'lucide-react';

type OutreachType = 'call' | 'email' | 'meeting' | 'text' | 'other';

interface LogOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  defaultType?: OutreachType;
  onSuccess?: () => void;
}

const OUTREACH_TYPES: { value: OutreachType; label: string; icon: typeof Phone; color: string }[] = [
  { value: 'call', label: 'Call', icon: Phone, color: 'blue' },
  { value: 'email', label: 'Email', icon: Mail, color: 'green' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'purple' },
  { value: 'text', label: 'Text', icon: MessageSquare, color: 'yellow' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'gray' },
];

const OUTCOMES = [
  { value: '', label: 'Select outcome (optional)' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'follow_up', label: 'Follow-up Needed' },
  { value: 'left_voicemail', label: 'Left Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'scheduled', label: 'Scheduled Appointment' },
  { value: 'completed', label: 'Completed' },
];

const DURATION_PRESETS = [15, 30, 45, 60];

export default function LogOutreachModal({
  isOpen,
  onClose,
  clientId: preselectedClientId,
  clientName: preselectedClientName,
  defaultType = 'call',
  onSuccess,
}: LogOutreachModalProps) {
  const [clients, setClients] = useState<GSRealtyClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [type, setType] = useState<OutreachType>(defaultType);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load clients when modal opens (only if no preselected client)
  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setSelectedClientId(preselectedClientId || '');
      setType(defaultType);
      setNotes('');
      setOutcome('');
      setDurationMinutes('');
      setError('');
      setSuccess(false);

      if (!preselectedClientId) {
        loadClients();
      } else {
        setLoadingClients(false);
      }
    }
  }, [isOpen, preselectedClientId, defaultType]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const { clients: fetchedClients, error } = await getAllClients();

      if (error || !fetchedClients) {
        setError('Failed to load clients');
        return;
      }

      setClients(fetchedClients);
    } catch (err) {
      setError('An error occurred while loading clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          type,
          notes: notes || null,
          outcome: outcome || null,
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 1.5 seconds
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to log activity');
      }
    } catch (err) {
      setError('An error occurred while logging the activity');
    } finally {
      setLoading(false);
    }
  };

  const getTypeButtonClasses = (typeValue: OutreachType, color: string) => {
    const isSelected = type === typeValue;
    const baseClasses = 'flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200';

    if (isSelected) {
      return `${baseClasses} bg-${color}-500/20 border-${color}-400 text-${color}-400`;
    }
    return `${baseClasses} bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:border-white/30`;
  };

  // Custom styles for selected states (Tailwind can't dynamically generate classes)
  const getSelectedStyles = (typeValue: OutreachType) => {
    if (type !== typeValue) return {};

    const colorMap: Record<OutreachType, { bg: string; border: string; text: string }> = {
      call: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgb(96, 165, 250)', text: 'rgb(96, 165, 250)' },
      email: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgb(74, 222, 128)', text: 'rgb(74, 222, 128)' },
      meeting: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgb(192, 132, 252)', text: 'rgb(192, 132, 252)' },
      text: { bg: 'rgba(234, 179, 8, 0.2)', border: 'rgb(250, 204, 21)', text: 'rgb(250, 204, 21)' },
      other: { bg: 'rgba(107, 114, 128, 0.2)', border: 'rgb(156, 163, 175)', text: 'rgb(156, 163, 175)' },
    };

    return {
      backgroundColor: colorMap[typeValue].bg,
      borderColor: colorMap[typeValue].border,
      color: colorMap[typeValue].text,
    };
  };

  const showDuration = type === 'call' || type === 'meeting';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Log Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Activity logged successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {!success && (
            <>
              {/* Client Selection */}
              {preselectedClientId ? (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-medium text-gray-900">{preselectedClientName}</span>
                  </div>
                </div>
              ) : loadingClients ? (
                <div className="mb-5 text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="mb-5">
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="client"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                    disabled={loading}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                        {client.email && ` (${client.email})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Activity Type */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Activity Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {OUTREACH_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        type === value
                          ? ''
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                      style={getSelectedStyles(value)}
                      disabled={loading}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration (conditional) */}
              {showDuration && (
                <div className="mb-5">
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duration (minutes)
                  </label>
                  <div className="flex gap-2 mb-2">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDurationMinutes(preset.toString())}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          durationMinutes === preset.toString()
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        disabled={loading}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    max="480"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Or enter custom duration..."
                    disabled={loading}
                  />
                </div>
              )}

              {/* Outcome */}
              <div className="mb-5">
                <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome
                </label>
                <select
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={loading}
                >
                  {OUTCOMES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Add notes about this interaction..."
                  disabled={loading}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {notes.length}/1000
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedClientId}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                    loading || !selectedClientId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Logging...
                    </>
                  ) : (
                    'Log Activity'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
