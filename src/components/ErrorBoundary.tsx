import * as React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { reportCrashlyticsError } from '../firebase';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Whisk ErrorBoundary caught error:', error, info);
    reportCrashlyticsError(error, {
      source: 'react_error_boundary',
      component_stack: (info.componentStack || '').slice(0, 500),
    });
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed.error && parsed.operationType) {
          friendly = `Database ${parsed.operationType} failed at "${parsed.path}": ${parsed.error}`;
        }
      } catch (_e) {
        // plain text error
      }

      return (
        <div className="min-h-screen bg-gradient-to-tr from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border-4 border-white text-center space-y-6">
            <div className="vibrant-gradient w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Oops, hit a tiny detour!
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed break-words">
              {friendly}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="vibrant-gradient text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest inline-flex items-center gap-2 hover:scale-105 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Reload Whisk
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
