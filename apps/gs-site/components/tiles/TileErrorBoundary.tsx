'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  tileName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for individual tiles.
 * Catches errors in tile rendering and displays a fallback UI
 * without crashing the entire dashboard.
 *
 * @example
 * ```tsx
 * <TileErrorBoundary tileName="Whoop Insights">
 *   <WhoopInsightsTile />
 * </TileErrorBoundary>
 * ```
 */
export class TileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error(
      `[TileErrorBoundary] Error in tile "${this.props.tileName || 'unknown'}":`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 bg-card border border-border rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-xs text-muted-foreground text-center mb-2">
            {this.props.tileName ? `${this.props.tileName} error` : 'Tile error'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-friendly wrapper for error boundary with automatic retry
 */
export function withTileErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  tileName?: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <TileErrorBoundary tileName={tileName}>
        <WrappedComponent {...props} />
      </TileErrorBoundary>
    );
  };
}

export default TileErrorBoundary;
