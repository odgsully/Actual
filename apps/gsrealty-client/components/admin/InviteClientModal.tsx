/**
 * Invite Client Modal Component
 * Admin component to send invitation emails to clients
 */

'use client';

import { useState, useEffect } from 'react';
import { getAllClients, type GSRealtyClient } from '@/lib/database/clients';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteClientModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteClientModalProps) {
  const [clients, setClients] = useState<GSRealtyClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
      // Reset form
      setSelectedClientId('');
      setCustomMessage('');
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const { clients: fetchedClients, error } = await getAllClients();

      if (error || !fetchedClients) {
        setError('Failed to load clients');
        return;
      }

      // Filter clients who don't have accounts yet
      const clientsWithoutAccounts = fetchedClients.filter(c => !c.user_id && c.email);
      setClients(clientsWithoutAccounts);

      if (clientsWithoutAccounts.length === 0) {
        setError('No clients available for invitation. All clients either have accounts or are missing email addresses.');
      }
    } catch (err) {
      setError('An error occurred while loading clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          customMessage: customMessage || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Invitation sent successfully to ${data.invitation.email}`);

        // Clear form
        setSelectedClientId('');
        setCustomMessage('');

        // Reload clients to update the list
        await loadClients();

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An error occurred while sending the invitation');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Invite Client</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Loading State */}
          {loadingClients ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No clients available for invitation.</p>
              <p className="text-sm text-gray-500 mt-2">
                All clients either have accounts or are missing email addresses.
              </p>
            </div>
          ) : (
            <>
              {/* Client Selection */}
              <div className="mb-6">
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  id="client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">-- Select a client --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} ({client.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {clients.length} {clients.length === 1 ? 'client' : 'clients'} available for invitation
                </p>
              </div>

              {/* Client Preview */}
              {selectedClient && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Client Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">
                        {selectedClient.first_name} {selectedClient.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.property_address && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Property:</span>
                        <span className="ml-2 font-medium">{selectedClient.property_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Message */}
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Add a personal message to include in the invitation email..."
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  This message will be displayed in the invitation email sent to the client
                </p>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>An invitation email will be sent to the client</li>
                  <li>The email contains a secure magic link valid for 7 days</li>
                  <li>Client clicks the link to set up their password</li>
                  <li>Once complete, they can access the client portal</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedClientId}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    loading || !selectedClientId
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
