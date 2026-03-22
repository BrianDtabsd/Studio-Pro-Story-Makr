import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unexpected application error.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error captured by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neu-base p-6">
          <div className="neu-flat rounded-3xl p-8 max-w-xl w-full text-center space-y-4">
            <h2 className="text-xl font-black text-neu-text-dark uppercase tracking-widest">Something broke</h2>
            <p className="text-sm text-neu-text">
              Story Makr hit an unexpected UI error. Reload to continue safely.
            </p>
            <p className="text-xs text-red-500 font-medium break-words">{this.state.message}</p>
            <button
              onClick={this.handleReload}
              className="neu-btn px-6 py-3 text-xs font-black uppercase tracking-widest text-accent-orange"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
