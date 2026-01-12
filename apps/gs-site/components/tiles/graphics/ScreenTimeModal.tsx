'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Upload,
  Clock,
  TrendingUp,
  Smartphone,
  Bell,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
} from 'lucide-react';
import { useScreenTime } from '@/hooks/useScreenTimeStats';
import { formatMinutes, getWeekStart } from '@/lib/screentime/types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface ScreenTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'upload' | 'thisWeek' | 'trends';

/**
 * ScreenTimeModal - Upload screenshots and view insights
 *
 * Tabs:
 * - Upload: Drag-drop zone for 1-3 screenshots
 * - This Week: Pie chart + metrics + top apps
 * - Trends: 4-week comparison chart
 */
export function ScreenTimeModal({ isOpen, onClose }: ScreenTimeModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('thisWeek');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    currentWeek,
    previousWeeks,
    hasData,
    isLoading,
    isUploading,
    uploadAsync,
    refetch,
  } = useScreenTime();

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files].slice(0, 3));
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files].slice(0, 3));
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await uploadAsync({ files: selectedFiles, weekStart: getWeekStart() });
      setUploadSuccess(true);
      setSelectedFiles([]);

      // Reset success message after 5 seconds and switch to This Week tab
      setTimeout(() => {
        setUploadSuccess(false);
        setActiveTab('thisWeek');
      }, 5000);

      // Refetch multiple times with increasing delays to catch when processing completes
      // Processing typically takes 5-15 seconds per image with OpenAI Vision
      setTimeout(() => refetch(), 3000);   // 3 seconds
      setTimeout(() => refetch(), 8000);   // 8 seconds
      setTimeout(() => refetch(), 15000);  // 15 seconds
      setTimeout(() => refetch(), 25000);  // 25 seconds (for 3 images)
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Remove a selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  // Tab content renderers
  const renderUploadTab = () => (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center
          transition-colors cursor-pointer
          ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('screenshot-input')?.click()}
      >
        <input
          id="screenshot-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <ImagePlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-1">
          Drop Screen Time screenshots here
        </p>
        <p className="text-sm text-muted-foreground">
          or click to browse (1-3 images, PNG/JPEG)
        </p>
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected ({selectedFiles.length}/3):
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <span className="text-sm truncate flex-1">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-background rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Process
              </>
            )}
          </button>
        </div>
      )}

      {/* Success message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
          <span>Screenshots uploaded! Processing with AI...</span>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="font-medium mb-2">How to get screenshots:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open Settings → Screen Time on your iPhone</li>
          <li>Tap "See All Activity"</li>
          <li>Take screenshots of the overview, pickups, and notifications sections</li>
          <li>Upload 1-3 screenshots here</li>
        </ol>
      </div>
    </div>
  );

  const renderThisWeekTab = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!hasData || !currentWeek) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No data for this week</p>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your Screen Time screenshots to see insights
          </p>
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Upload Screenshots
          </button>
        </div>
      );
    }

    const pieData = currentWeek.categories?.map((cat) => ({
      name: cat.name,
      value: cat.minutes,
      color: cat.color,
    })) || [];

    return (
      <div className="space-y-6">
        {/* Overview metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Clock className="w-5 h-5" />}
            label="Daily Average"
            value={currentWeek.dailyAverage || 'N/A'}
            change={currentWeek.weekOverWeekChange}
          />
          <MetricCard
            icon={<Smartphone className="w-5 h-5" />}
            label="Daily Pickups"
            value={currentWeek.dailyPickups?.toString() || 'N/A'}
          />
          <MetricCard
            icon={<Bell className="w-5 h-5" />}
            label="Daily Notifications"
            value={currentWeek.dailyNotifications?.toString() || 'N/A'}
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total This Week"
            value={currentWeek.totalTime || 'N/A'}
          />
        </div>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatMinutes(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top apps */}
        {currentWeek.topApps && currentWeek.topApps.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Apps</h3>
            <div className="space-y-2">
              {currentWeek.topApps.slice(0, 5).map((app, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="font-medium">{app.name}</span>
                  <span className="text-muted-foreground">{app.formatted}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrendsTab = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Combine current + previous weeks for trend chart
    const allWeeks = [
      ...(currentWeek ? [currentWeek] : []),
      ...(previousWeeks || []),
    ].slice(0, 4).reverse();

    if (allWeeks.length < 2) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Not enough data for trends</p>
          <p className="text-sm text-muted-foreground">
            Upload screenshots for multiple weeks to see trends
          </p>
        </div>
      );
    }

    const trendData = allWeeks.map((week) => ({
      week: week.weekLabel.split(' - ')[0], // Just the start date
      minutes: week.dailyAverageMinutes || 0,
      pickups: week.dailyPickups || 0,
    }));

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Daily Average Screen Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="week"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(value / 60)}h`}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => formatMinutes(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Daily Pickups</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="week"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="pickups" fill="#f472b6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Screen Time</h2>
              <p className="text-sm text-muted-foreground">
                {currentWeek?.weekLabel || 'Current Week'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['upload', 'thisWeek', 'trends'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab === 'upload' && 'Upload'}
              {tab === 'thisWeek' && 'This Week'}
              {tab === 'trends' && 'Trends'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' && renderUploadTab()}
          {activeTab === 'thisWeek' && renderThisWeekTab()}
          {activeTab === 'trends' && renderTrendsTab()}
        </div>
      </div>
    </div>
  );
}

// Metric card component
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number | null;
}

function MetricCard({ icon, label, value, change }: MetricCardProps) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-semibold">{value}</span>
        {change != null && (
          <span
            className={`text-xs ${
              change > 0 ? 'text-red-500' : change < 0 ? 'text-green-500' : 'text-muted-foreground'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
    </div>
  );
}

export default ScreenTimeModal;
