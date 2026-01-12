'use client';

import { useState } from 'react';
import { X, Scale, Dumbbell, Droplets, Activity, Loader2, Check } from 'lucide-react';

interface InBodyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  scanDate: string;
  weightKg: string;
  bodyFatPercent: string;
  muscleMassKg: string;
  bodyFatMassKg: string;
  bmi: string;
  bmr: string;
  visceralFatLevel: string;
  inbodyScore: string;
  totalBodyWaterL: string;
  locationName: string;
  notes: string;
}

const initialFormData: FormData = {
  scanDate: new Date().toISOString().split('T')[0],
  weightKg: '',
  bodyFatPercent: '',
  muscleMassKg: '',
  bodyFatMassKg: '',
  bmi: '',
  bmr: '',
  visceralFatLevel: '',
  inbodyScore: '',
  totalBodyWaterL: '',
  locationName: '',
  notes: '',
};

/**
 * InBodyFormModal - Manual InBody scan entry form
 *
 * Opens as a modal to enter body composition data from gym InBody printouts.
 * Stores data in Supabase and optionally syncs to Notion.
 */
export function InBodyFormModal({ isOpen, onClose, onSuccess }: InBodyFormModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (!formData.scanDate || !formData.weightKg || !formData.bodyFatPercent || !formData.muscleMassKg) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/inbody/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanDate: formData.scanDate,
          weightKg: parseFloat(formData.weightKg),
          bodyFatPercent: parseFloat(formData.bodyFatPercent),
          muscleMassKg: parseFloat(formData.muscleMassKg),
          bodyFatMassKg: formData.bodyFatMassKg ? parseFloat(formData.bodyFatMassKg) : undefined,
          bmi: formData.bmi ? parseFloat(formData.bmi) : undefined,
          bmr: formData.bmr ? parseInt(formData.bmr, 10) : undefined,
          visceralFatLevel: formData.visceralFatLevel ? parseInt(formData.visceralFatLevel, 10) : undefined,
          inbodyScore: formData.inbodyScore ? parseInt(formData.inbodyScore, 10) : undefined,
          totalBodyWaterL: formData.totalBodyWaterL ? parseFloat(formData.totalBodyWaterL) : undefined,
          locationName: formData.locationName || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save scan');
      }

      setSuccess(true);
      setTimeout(() => {
        setFormData(initialFormData);
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Log InBody Scan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Success State */}
          {success && (
            <div className="flex flex-col items-center justify-center py-12 text-green-500">
              <Check className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Scan saved successfully!</p>
            </div>
          )}

          {!success && (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Scan Date & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Scan Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="scanDate"
                    value={formData.scanDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleChange}
                    placeholder="e.g., LA Fitness Scottsdale"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Core Metrics Section */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  Core Metrics (from your printout)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="weightKg"
                      value={formData.weightKg}
                      onChange={handleChange}
                      placeholder="82.5"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Body Fat % <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="bodyFatPercent"
                      value={formData.bodyFatPercent}
                      onChange={handleChange}
                      placeholder="18.2"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Skeletal Muscle Mass (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="muscleMassKg"
                      value={formData.muscleMassKg}
                      onChange={handleChange}
                      placeholder="38.4"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Body Fat Mass (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="bodyFatMassKg"
                      value={formData.bodyFatMassKg}
                      onChange={handleChange}
                      placeholder="15.0"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Metrics Section */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Dumbbell className="w-4 h-4" />
                  Additional Metrics (optional)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">BMI</label>
                    <input
                      type="number"
                      step="0.1"
                      name="bmi"
                      value={formData.bmi}
                      onChange={handleChange}
                      placeholder="24.1"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">BMR (kcal)</label>
                    <input
                      type="number"
                      name="bmr"
                      value={formData.bmr}
                      onChange={handleChange}
                      placeholder="1820"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">InBody Score</label>
                    <input
                      type="number"
                      name="inbodyScore"
                      value={formData.inbodyScore}
                      onChange={handleChange}
                      placeholder="78"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Visceral Fat Level</label>
                    <input
                      type="number"
                      name="visceralFatLevel"
                      value={formData.visceralFatLevel}
                      onChange={handleChange}
                      placeholder="8"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-1 text-sm font-medium mb-1.5">
                      <Droplets className="w-3 h-3" />
                      Total Body Water (L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="totalBodyWaterL"
                      value={formData.totalBodyWaterL}
                      onChange={handleChange}
                      placeholder="49.2"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any observations about this scan..."
                  rows={2}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Tip */}
              <p className="text-xs text-muted-foreground">
                Tip: Look at your InBody printout for these values. Weight, Body Fat %, and Skeletal
                Muscle Mass are the key metrics to track.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Scan
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InBodyFormModal;
