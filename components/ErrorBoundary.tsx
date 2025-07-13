
import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-lg text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Something went wrong.</h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                    We've encountered an unexpected error. This can happen if the application is unable to connect to the server. Please try refreshing the page.
                </p>
                {this.state.error && (
                    <pre className="mt-4 text-xs text-left bg-neutral-100 dark:bg-neutral-700 p-2 rounded-md overflow-x-auto text-red-500">
                        {this.state.error.toString()}
                    </pre>
                )}
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-600"
                >
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
