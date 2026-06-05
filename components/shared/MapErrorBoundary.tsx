'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Map rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-[#FDFDFD] flex flex-col items-center justify-center opacity-50">
          <AlertTriangle size={32} strokeWidth={1.5} className="text-slate-400 mb-2" />
          <p className="text-[11px] font-semibold text-slate-400">Map Unavailable</p>
        </div>
      );
    }

    return this.props.children;
  }
}
