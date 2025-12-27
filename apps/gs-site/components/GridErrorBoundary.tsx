'use client';

import { Component, ReactNode } from 'react';
import { CSSGridFallback } from './DraggableGrid';

interface Props {
  children: ReactNode;
  fallbackChildren: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GridErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DraggableGrid error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <CSSGridFallback>{this.props.fallbackChildren}</CSSGridFallback>;
    }

    return this.props.children;
  }
}
