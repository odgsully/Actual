'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Apple,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Settings,
  Check,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Upload,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import {
  useMyFitnessPalStats,
  useMyFitnessPalData,
  useConnectMFP,
  useSyncMFP,
  useDisconnectMFP,
  useUploadMFP,
} from '@/hooks/useMyFitnessPalStats';

interface MyFitnessPalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'today' | 'week' | 'month' | 'settings';

/**
 * MyFitnessPalModal - Detailed MFP data view and settings
 *
 * Tabs:
 * - Today: Full macro breakdown for today
 * - Week: 7-day calorie/protein chart
 * - Weight: Weight trend chart
 * - Settings: Connect/reconnect, sync, disconnect
 */
export function MyFitnessPalModal({ isOpen, onClose }: MyFitnessPalModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [cookieInput, setCookieInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('garrett_sullivan');
  const [copySuccess, setCopySuccess] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // CSV Upload state
  const [nutritionCSV, setNutritionCSV] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    food: number;
  } | null>(null);

  const { isConnected, needsReconnect, username, lastSyncAt, refetch } =
    useMyFitnessPalStats({ enabled: isOpen });

  const { data: weekData, isLoading: weekLoading } = useMyFitnessPalData(
    'week',
    isOpen && (activeTab === 'week' || activeTab === 'today')
  );

  const { data: monthData, isLoading: monthLoading } = useMyFitnessPalData(
    'month',
    isOpen && activeTab === 'month'
  );

  const connectMutation = useConnectMFP();
  const syncMutation = useSyncMFP();
  const disconnectMutation = useDisconnectMFP();
  const uploadMutation = useUploadMFP();

  // Reset tab if not connected
  useEffect(() => {
    if (!isConnected || needsReconnect) {
      setActiveTab('settings');
    }
  }, [isConnected, needsReconnect]);

  // Clear upload result after 5 seconds
  useEffect(() => {
    if (uploadResult) {
      const timer = setTimeout(() => setUploadResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadResult]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!cookieInput.trim()) return;

    setConnectError(null); // Clear previous errors

    try {
      const result = await connectMutation.mutateAsync({
        mfpSession: cookieInput.trim(),
        username: usernameInput.trim(),
      });

      console.log('[MFP Modal] Connect result:', result);

      // Check the actual result, not the mutation state
      if (result.success) {
        setCookieInput('');
        setConnectError(null);
        // Refetch status to update the UI
        await refetch();
        setActiveTab('today');
      } else {
        // API returned success: false with an error message
        setConnectError(result.error || 'Failed to connect. Please try again.');
      }
    } catch (error) {
      console.error('[MFP Modal] Connect failed:', error);
      setConnectError(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const handleSync = async () => {
    await syncMutation.mutateAsync(7);
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect MyFitnessPal?')) {
      await disconnectMutation.mutateAsync();
    }
  };

  // Handle CSV file selection
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNutritionCSV(content);
    };
    reader.readAsText(file);
  };

  // Handle CSV upload
  const handleUpload = async () => {
    if (!nutritionCSV) return;

    setUploadResult(null);

    try {
      const result = await uploadMutation.mutateAsync({
        nutrition: nutritionCSV,
      });

      if (result.success && result.imported) {
        setUploadResult({
          success: true,
          food: result.imported.food,
        });
        // Clear file input after successful upload
        setNutritionCSV(null);
        // Refresh data
        await refetch();
      }
    } catch (error) {
      console.error('[MFP Modal] Upload failed:', error);
    }
  };

  const copyInstructions = () => {
    const text = `1. Go to myfitnesspal.com and log in
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Application > Cookies > myfitnesspal.com
4. Find MFP_SESSION and copy its value`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
    { id: 'week', label: 'Week', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'month', label: 'Month', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl h-[85vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Apple className="w-6 h-6 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                MyFitnessPal
              </h2>
              {isConnected && username && (
                <p className="text-xs text-muted-foreground">@{username}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 py-3 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={
                (tab.id !== 'settings' && !isConnected) ||
                (tab.id !== 'settings' && needsReconnect)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Today Tab */}
          {activeTab === 'today' && isConnected && !needsReconnect && (
            <TodayTab data={weekData} isLoading={weekLoading} />
          )}

          {/* Week Tab */}
          {activeTab === 'week' && isConnected && !needsReconnect && (
            <WeekTab data={weekData} isLoading={weekLoading} />
          )}

          {/* Month Tab */}
          {activeTab === 'month' && isConnected && !needsReconnect && (
            <MonthTab data={monthData} isLoading={monthLoading} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Connection Status */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected && !needsReconnect
                        ? 'bg-green-500'
                        : needsReconnect
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium">
                    {isConnected && !needsReconnect
                      ? 'Connected'
                      : needsReconnect
                      ? 'Session Expired'
                      : 'Not Connected'}
                  </span>
                </div>
                {lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Connect/Reconnect Form */}
              {(!isConnected || needsReconnect) && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      {needsReconnect ? 'Reconnect' : 'Connect'} MyFitnessPal
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Due to MFP's security measures, you need to manually extract
                      your session cookie from your browser.
                    </p>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-500">
                        How to get your session cookie:
                      </h4>
                      <button
                        onClick={copyInstructions}
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {copySuccess ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Go to{' '}
                        <a
                          href="https://www.myfitnesspal.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center gap-1"
                        >
                          myfitnesspal.com
                          <ExternalLink className="w-3 h-3" />
                        </a>{' '}
                        and log in
                      </li>
                      <li>
                        Open DevTools (F12 or Cmd+Option+I on Mac)
                      </li>
                      <li>
                        Go to <strong>Application</strong> tab →{' '}
                        <strong>Cookies</strong> → myfitnesspal.com
                      </li>
                      <li>
                        Find <code className="px-1 bg-muted rounded">MFP_SESSION</code>{' '}
                        and copy its value
                      </li>
                    </ol>
                  </div>

                  {/* Username Input */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      MFP Username
                    </label>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="garrett_sullivan"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Cookie Input */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      MFP_SESSION Cookie Value
                    </label>
                    <textarea
                      value={cookieInput}
                      onChange={(e) => setCookieInput(e.target.value)}
                      placeholder="Paste your MFP_SESSION cookie value here..."
                      rows={3}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Error Display */}
                  {(connectError || connectMutation.error) && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-500">
                        {connectError ||
                          (connectMutation.error instanceof Error
                            ? connectMutation.error.message
                            : 'Failed to connect')}
                      </p>
                    </div>
                  )}

                  {/* Connect Button */}
                  <button
                    onClick={handleConnect}
                    disabled={!cookieInput.trim() || connectMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        {needsReconnect ? 'Reconnect' : 'Connect'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* CSV Upload Section - Always shown */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload MFP Export
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Export your Nutrition Summary from MFP and upload the CSV file here.
                  </p>
                </div>

                {/* Export Link Button */}
                <a
                  href="https://www.myfitnesspal.com/reports/export"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open MFP Export Page
                </a>

                {/* File Input */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Nutrition Summary.csv
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
                    />
                    {nutritionCSV && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!nutritionCSV || uploadMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload CSV Files
                    </>
                  )}
                </button>

                {/* Upload Success */}
                {uploadResult && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Imported {uploadResult.food} food diary entries
                    </p>
                  </div>
                )}

                {/* Upload Error */}
                {uploadMutation.isError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-500">
                      {uploadMutation.error instanceof Error
                        ? uploadMutation.error.message
                        : 'Upload failed'}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions for Connected Users */}
              {isConnected && !needsReconnect && (
                <div className="space-y-4 pt-4 border-t border-border">
                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect MyFitnessPal'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Today Tab Component
function TodayTab({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useMyFitnessPalData>['data'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayData = data?.food?.find((f) => f.date === today);

  if (!todayData) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No data logged today</h3>
        <p className="text-muted-foreground">
          Log your meals in MyFitnessPal to see your data here.
        </p>
      </div>
    );
  }

  const macros = [
    {
      label: 'Calories',
      value: todayData.calories,
      unit: 'kcal',
      color: 'text-orange-500',
    },
    {
      label: 'Protein',
      value: todayData.protein_g,
      unit: 'g',
      color: 'text-red-500',
    },
    {
      label: 'Carbs',
      value: todayData.carbs_g,
      unit: 'g',
      color: 'text-blue-500',
    },
    {
      label: 'Fat',
      value: todayData.fat_g,
      unit: 'g',
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {macros.map((macro) => (
          <div
            key={macro.label}
            className="p-4 bg-muted/30 rounded-lg text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">{macro.label}</p>
            <p className={`text-2xl font-bold ${macro.color}`}>
              {Math.round(macro.value)}
            </p>
            <p className="text-xs text-muted-foreground">{macro.unit}</p>
          </div>
        ))}
      </div>

      {/* Additional details */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="font-medium mb-2">Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Meals Logged:</span>{' '}
            <span className="font-medium">{todayData.mealsLogged}</span>
          </div>
          {todayData.fiber_g && (
            <div>
              <span className="text-muted-foreground">Fiber:</span>{' '}
              <span className="font-medium">{Math.round(todayData.fiber_g)}g</span>
            </div>
          )}
          {todayData.sugar_g && (
            <div>
              <span className="text-muted-foreground">Sugar:</span>{' '}
              <span className="font-medium">{Math.round(todayData.sugar_g)}g</span>
            </div>
          )}
          {todayData.sodium_mg && (
            <div>
              <span className="text-muted-foreground">Sodium:</span>{' '}
              <span className="font-medium">
                {Math.round(todayData.sodium_mg)}mg
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Week Tab Component - Shows last 7 logged days (not calendar days)
function WeekTab({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useMyFitnessPalData>['data'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const foodData = data?.food || [];
  const extendedData = data as any; // Access rollingAverages
  const rollingAverages = extendedData?.rollingAverages;

  // Filter to days with actual data and take the last 7
  const loggedDays = foodData.filter((d) => d.calories > 0);

  if (loggedDays.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No data this week</h3>
        <p className="text-muted-foreground">
          Upload your MFP export to see weekly progress.
        </p>
      </div>
    );
  }

  // Sort by date ascending and take last 7 logged days
  const sortedData = [...loggedDays]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  const maxCalories = Math.max(...sortedData.map((d) => d.calories), 1);

  return (
    <div className="space-y-6">
      {/* Summary with rolling averages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rollingAverages ? (
          <>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">7-Day Avg</p>
              <p className="text-xl font-bold">{rollingAverages.last7Days.avgCalories}</p>
              <p className="text-[10px] text-muted-foreground">cal/day</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg Protein</p>
              <p className="text-xl font-bold">{rollingAverages.last7Days.avgProtein}g</p>
              <p className="text-[10px] text-muted-foreground">per day</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Week Change</p>
              <div className="flex items-center justify-center gap-1">
                {rollingAverages.weekOverWeekChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : rollingAverages.weekOverWeekChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
                <p
                  className={`text-xl font-bold ${
                    rollingAverages.weekOverWeekChange > 0
                      ? 'text-green-500'
                      : rollingAverages.weekOverWeekChange < 0
                      ? 'text-red-500'
                      : ''
                  }`}
                >
                  {rollingAverages.weekOverWeekChange > 0 ? '+' : ''}
                  {rollingAverages.weekOverWeekChange}%
                </p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Streak</p>
              <p className="text-xl font-bold flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {data?.summary?.currentStreak || 0}
              </p>
            </div>
          </>
        ) : data?.summary ? (
          <>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg Calories</p>
              <p className="text-xl font-bold">{data.summary.avgCalories}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg Protein</p>
              <p className="text-xl font-bold">{data.summary.avgProtein}g</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Days Logged</p>
              <p className="text-xl font-bold">{data.summary.daysLogged}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Streak</p>
              <p className="text-xl font-bold flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {data.summary.currentStreak}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Daily breakdown bar chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Last {sortedData.length} Logged Days</h3>
          <span className="text-xs text-muted-foreground">
            {sortedData.length < 7 ? '(showing all logged days)' : ''}
          </span>
        </div>
        {sortedData.map((day) => {
          const percent = (day.calories / maxCalories) * 100;
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-16 text-xs text-muted-foreground">
                <div>{dayName}</div>
                <div>{dateStr}</div>
              </div>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${percent}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {day.calories}
                  </span>
                </div>
              </div>
              <div className="w-12 text-xs text-muted-foreground text-right">
                {day.protein_g}g P
              </div>
            </div>
          );
        })}
      </div>

      {/* Macro breakdown for the week */}
      {rollingAverages && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium mb-3">7-Day Macro Averages</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-orange-500">
                {rollingAverages.last7Days.avgCalories}
              </p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">
                {rollingAverages.last7Days.avgProtein}g
              </p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-500">
                {rollingAverages.last7Days.avgCarbs}g
              </p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-500">
                {rollingAverages.last7Days.avgFat}g
              </p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Month Tab Component - Shows monthly comparison and rolling averages
function MonthTab({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useMyFitnessPalData>['data'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const foodData = data?.food || [];
  const extendedData = data as any; // Access rollingAverages and weeklyComparison
  const rollingAverages = extendedData?.rollingAverages;
  const weeklyComparison = extendedData?.weeklyComparison || [];

  if (foodData.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No data this month</h3>
        <p className="text-muted-foreground">
          Upload your MFP export to see monthly trends.
        </p>
      </div>
    );
  }

  // Filter to days with actual data
  const loggedDays = foodData.filter((d) => d.calories > 0);

  return (
    <div className="space-y-6">
      {/* Rolling Averages Comparison */}
      {rollingAverages && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Last 7 Days</p>
            <p className="text-2xl font-bold">{rollingAverages.last7Days.avgCalories}</p>
            <p className="text-xs text-muted-foreground">cal/day avg</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Last 30 Days</p>
            <p className="text-2xl font-bold">{rollingAverages.last30Days.avgCalories}</p>
            <p className="text-xs text-muted-foreground">cal/day avg</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Week Change</p>
            <div className="flex items-center justify-center gap-1">
              {rollingAverages.weekOverWeekChange > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : rollingAverages.weekOverWeekChange < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-500" />
              ) : (
                <Minus className="w-5 h-5 text-muted-foreground" />
              )}
              <p
                className={`text-2xl font-bold ${
                  rollingAverages.weekOverWeekChange > 0
                    ? 'text-green-500'
                    : rollingAverages.weekOverWeekChange < 0
                    ? 'text-red-500'
                    : ''
                }`}
              >
                {rollingAverages.weekOverWeekChange > 0 ? '+' : ''}
                {rollingAverages.weekOverWeekChange}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground">vs prev week</p>
          </div>
        </div>
      )}

      {/* Macro Breakdown (Last 30 Days) */}
      {rollingAverages && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium mb-3">30-Day Macro Averages</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-orange-500">
                {rollingAverages.last30Days.avgCalories}
              </p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">
                {rollingAverages.last30Days.avgProtein}g
              </p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-500">
                {rollingAverages.last30Days.avgCarbs}g
              </p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-500">
                {rollingAverages.last30Days.avgFat}g
              </p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Comparison Chart */}
      {weeklyComparison.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Weekly Comparison</h3>
          <p className="text-xs text-muted-foreground mb-3">Average calories per day by week</p>
          {weeklyComparison.slice(0, 4).reverse().map((week: any, idx: number) => {
            const maxCal = Math.max(...weeklyComparison.map((w: any) => w.avgCalories), 1);
            const percent = (week.avgCalories / maxCal) * 100;
            const weekStart = new Date(week.weekStart);
            const weekLabel = weekStart.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={week.weekStart} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">
                  <div>{weekLabel}</div>
                  <div className="text-[10px]">{week.daysLogged}d logged</div>
                </div>
                <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${percent}%` }}
                  >
                    <span className="text-xs font-medium text-primary-foreground">
                      {week.avgCalories}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="font-medium mb-2">Monthly Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Days Logged:</span>{' '}
            <span className="font-medium">{loggedDays.length}</span>
          </div>
          {data?.summary && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Streak:</span>{' '}
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="font-medium">{data.summary.currentStreak} days</span>
              </div>
              {data.summary.latestWeight && (
                <div>
                  <span className="text-muted-foreground">Latest Weight:</span>{' '}
                  <span className="font-medium">{data.summary.latestWeight} lbs</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyFitnessPalModal;
