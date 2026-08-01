import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error in Boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in bg-[#0B1220]/90 rounded-2xl border border-red-500/30 my-4">
          <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-red-400 shadow-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-base font-bold text-white">حدث تنبيه غير متوقع أثناء تحميل هذه الشاشة</h2>
            <p className="text-xs text-gray-300 bg-black/50 p-3 rounded-xl border border-white/10 text-right dir-ltr font-mono overflow-x-auto max-h-32">
              {this.state.error?.message || 'عذراً، حدث خطأ أثناء معالجة البيانات.'}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#ff8a33] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة والتنشيط</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
