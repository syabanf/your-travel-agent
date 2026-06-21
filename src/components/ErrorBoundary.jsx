import { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// App-wide error boundary — turns a thrown render error into a friendly,
// recoverable screen instead of a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook for real monitoring (Sentry, etc.) later.
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F3F6FB] font-body">
          <div className="bg-white rounded-2xl border border-mora-primary/10 shadow-sm p-8 max-w-md text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-display font-bold text-mora-primary">Something went wrong</h1>
            <p className="text-sm text-mora-neutral mt-1.5">
              An unexpected error occurred. You can reload the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 mt-5 press"
            >
              <RotateCcw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
