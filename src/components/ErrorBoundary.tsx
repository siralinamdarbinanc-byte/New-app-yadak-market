import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (window.confirm('آیا مطمئن هستید؟ با این کار داده‌های محلی بازنشانی شده و برنامه از ابتدا بارگذاری می‌شود.')) {
      try {
        localStorage.removeItem('yadak_products');
        localStorage.removeItem('yadak_pending_sheet_changes');
      } catch (e) {
        console.error(e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-right dir-rtl font-['Vazirmatn',sans-serif]">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-lg font-black text-slate-100">خطا در بارگذاری برنامه</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                متأسفانه مشکلی در اجرای برنامه رخ داده است. این موضوع ممکن است به دلیل حافظه کم یا ناسازگاری نسخه مرورگر باشد.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-red-300/80 overflow-x-auto max-h-28 text-left dir-ltr dir-left">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بارگذاری مجدد برنامه</span>
              </button>

              <button
                onClick={this.handleResetData}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all rounded-xl font-medium text-xs flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی حافظه محلی و اجرای مجدد</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
