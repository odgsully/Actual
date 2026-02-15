'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDeal, type CreateDealInput } from '@/lib/database/deals'
import { getAllClients, type GSRealtyClient } from '@/lib/database/clients'
import { STAGE_CONFIG, STAGES, type DealStage } from '@/lib/database/pipeline'
import {
  ArrowLeft,
  Save,
  Briefcase,
  DollarSign,
  Home,
  FileText,
  User,
  Calendar,
} from 'lucide-react'

export default function NewDealPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<GSRealtyClient[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [formData, setFormData] = useState<CreateDealInput>({
    client_id: '',
    type: 'buyer',
    stage: 'on_radar',
    property_address: '',
    deal_value: 0,
    commission_rate: 0.03,
    representation_end_date: '',
    notes: '',
  })

  // Fetch clients for dropdown
  useEffect(() => {
    const fetchClients = async () => {
      const { clients: data } = await getAllClients()
      setClients(data ?? [])
      setLoadingClients(false)
    }
    fetchClients()
  }, [])

  const handleChange = (field: keyof CreateDealInput, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.client_id) {
      setError('Please select a client')
      return
    }

    setSaving(true)

    const { deal, error: createError } = await createDeal(formData)

    if (createError) {
      setError(createError.message || 'Failed to create deal')
      setSaving(false)
      return
    }

    // Success! Redirect to pipeline
    router.push('/admin/pipeline')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const expectedCommission = (formData.deal_value ?? 0) * (formData.commission_rate ?? 0)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Deal</h1>
          <p className="text-white/60 mt-1">Create a new buyer or seller deal</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
          <p className="text-sm font-medium text-red-300">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Type */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Client & Deal Type</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Select */}
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-white/80 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                id="client_id"
                value={formData.client_id}
                onChange={(e) => handleChange('client_id', e.target.value)}
                required
                disabled={loadingClients}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
              >
                <option value="" className="bg-gray-900">
                  {loadingClients ? 'Loading clients...' : 'Select a client'}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="bg-gray-900">
                    {client.first_name} {client.last_name}
                    {client.email ? ` (${client.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Deal Type */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Deal Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'buyer')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 ${
                    formData.type === 'buyer'
                      ? 'bg-blue-500/30 border-blue-400/50 text-blue-400'
                      : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('type', 'seller')}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 ${
                    formData.type === 'seller'
                      ? 'bg-pink-500/30 border-pink-400/50 text-pink-400'
                      : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Seller
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stage & Property */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Deal Details</span>
          </h2>

          <div className="space-y-4">
            {/* Stage */}
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-white/80 mb-2">
                Pipeline Stage
              </label>
              <select
                id="stage"
                value={formData.stage}
                onChange={(e) => handleChange('stage', e.target.value as DealStage)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage} className="bg-gray-900">
                    {STAGE_CONFIG[stage].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Address */}
            <div>
              <label
                htmlFor="property_address"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Property Address
              </label>
              <div className="relative">
                <Home className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="property_address"
                  type="text"
                  value={formData.property_address}
                  onChange={(e) => handleChange('property_address', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="123 Main St, Phoenix, AZ 85001"
                />
              </div>
            </div>

            {/* Representation End Date */}
            <div>
              <label
                htmlFor="representation_end_date"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Representation End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="representation_end_date"
                  type="date"
                  value={formData.representation_end_date}
                  onChange={(e) => handleChange('representation_end_date', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Financial Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deal Value */}
            <div>
              <label htmlFor="deal_value" className="block text-sm font-medium text-white/80 mb-2">
                Deal Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="deal_value"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.deal_value || ''}
                  onChange={(e) => handleChange('deal_value', Number(e.target.value))}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="500000"
                />
              </div>
            </div>

            {/* Commission Rate */}
            <div>
              <label
                htmlFor="commission_rate"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Commission Rate (%)
              </label>
              <input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={((formData.commission_rate ?? 0) * 100).toFixed(1)}
                onChange={(e) => handleChange('commission_rate', Number(e.target.value) / 100)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Expected Commission Preview */}
          {(formData.deal_value ?? 0) > 0 && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-400/20 rounded-xl">
              <p className="text-sm text-green-400">
                Expected Commission:{' '}
                <span className="font-bold text-lg">{formatCurrency(expectedCommission)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Notes</span>
          </h2>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors resize-none"
              placeholder="Add any additional notes about this deal..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-brand-red text-white font-semibold rounded-lg hover:bg-brand-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Create Deal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
