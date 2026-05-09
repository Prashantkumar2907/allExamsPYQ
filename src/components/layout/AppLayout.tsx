import { useState, Component, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-lg font-semibold text-[var(--danger)]">Something went wrong</p>
            <p className="text-sm text-[var(--fg-muted)]">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-fg)] focus-ring"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-dvh flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[var(--overlay)] z-30 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 md:p-4">
          <ErrorBoundary>
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
