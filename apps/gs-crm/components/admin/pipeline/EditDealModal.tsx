'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateDeal, type UpdateDealInput } from '@/lib/database/deals'
import { STAGE_CONFIG, STAGES, type DealStage } from '@/lib/database/pipeline'
import type { DealWithClient } from '@/lib/database/pipeline'
import {
  X,
  Save,
  DollarSign,
  Home,
  Calendar,
  FileText,
  Briefcase,
} from 'lucide-react'

interface EditDealModalProps {
  isOpen: boolean
  onClose: () => void
  deal: DealWithClient | null
  onSuccess: () => void
}

export function EditDealModal({ isOpen, onClose, deal, onSuccess }: EditDealModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<UpdateDealInput>({
    type: 'buyer',
    stage: 'on_radar',
    property_address: '',
    deal_value: 0,
    commission_rate: 0.03,
    representation_end_date: '',
    notes: '',
  })

  // Sync form data when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        type: deal.type,
        stage: deal.stage,
        property_address: deal.property_address || '',
        deal_value: deal.deal_value || 0,
        commission_rate: deal.commission_rate ?? 0.03,
        representation_end_date: deal.representation_end_date || '',
        notes: deal.notes || '',
      })
      setError('')
    }
  }, [deal])

  const handleChange = (field: keyof UpdateDealInput, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deal) return

    setError('')
    setSaving(true)

    const { error: updateError } = await updateDeal(deal.id, formData)

    if (updateError) {
      setError(updateError.message || 'Failed to update deal')
      setSaving(false)
      return
    }

    setSaving(false)
    onSuccess()
    onClose()
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

  const clientName = deal?.client
    ? `${deal.client.first_name} ${deal.client.last_name}`
    : 'Unknown Client'

  if (!isOpen || !deal) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white">Edit Deal</h3>
            <p className="text-white/60 text-sm mt-1">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/20 border border-red-400/30 rounded-xl p-3">
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Deal Type */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Deal Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange('type', 'buyer')}
                className={`flex-1 py-2.5 px-4 rounded-xl border transition-all duration-300 text-sm ${
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
                className={`flex-1 py-2.5 px-4 rounded-xl border transition-all duration-300 text-sm ${
                  formData.type === 'seller'
                    ? 'bg-pink-500/30 border-pink-400/50 text-pink-400'
                    : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                }`}
              >
                Seller
              </button>
            </div>
          </div>

          {/* Stage */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-white/80 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1.5" />
              Pipeline Stage
            </label>
            <select
              id="stage"
              value={formData.stage}
              onChange={(e) => handleChange('stage', e.target.value as DealStage)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors text-sm"
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
            <label htmlFor="property_address" className="block text-sm font-medium text-white/80 mb-2">
              <Home className="w-4 h-4 inline mr-1.5" />
              Property Address
            </label>
            <Input
              id="property_address"
              type="text"
              value={formData.property_address}
              onChange={(e) => handleChange('property_address', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 text-sm"
              placeholder="123 Main St, Phoenix, AZ 85001"
            />
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Deal Value */}
            <div>
              <label htmlFor="deal_value" className="block text-sm font-medium text-white/80 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1.5" />
                Deal Value
              </label>
              <Input
                id="deal_value"
                type="number"
                min="0"
                step="1000"
                value={formData.deal_value || ''}
                onChange={(e) => handleChange('deal_value', Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 text-sm"
                placeholder="500000"
              />
            </div>

            {/* Commission Rate */}
            <div>
              <label htmlFor="commission_rate" className="block text-sm font-medium text-white/80 mb-2">
                Commission %
              </label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={((formData.commission_rate ?? 0) * 100).toFixed(1)}
                onChange={(e) => handleChange('commission_rate', Number(e.target.value) / 100)}
                className="w-full px-4 py-2.5 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 text-sm"
              />
            </div>
          </div>

          {/* Expected Commission Preview */}
          {(formData.deal_value ?? 0) > 0 && (
            <div className="p-3 bg-green-500/10 border border-green-400/20 rounded-xl">
              <p className="text-sm text-green-400">
                Expected Commission:{' '}
                <span className="font-bold">{formatCurrency(expectedCommission)}</span>
              </p>
            </div>
          )}

          {/* Representation End Date */}
          <div>
            <label htmlFor="representation_end_date" className="block text-sm font-medium text-white/80 mb-2">
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Representation End Date
            </label>
            <Input
              id="representation_end_date"
              type="date"
              value={formData.representation_end_date}
              onChange={(e) => handleChange('representation_end_date', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-white/80 mb-2">
              <FileText className="w-4 h-4 inline mr-1.5" />
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:outline-none transition-colors resize-none text-sm"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
