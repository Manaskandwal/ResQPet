import { Component } from 'react';

/**
 * Error Boundary component to catch React errors and prevent total app crashes.
 * Wraps the entire app and displays a friendly error UI instead of a blank screen.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log to console in development
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

        // In production, you would send this to an error tracking service (Sentry, etc.)
        // if (process.env.NODE_ENV === 'production') {
        //     sendToErrorTracking(error, errorInfo);
        // }

        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                            <p className="text-gray-600 text-sm">
                                We encountered an unexpected error. Don't worry, our team has been notified.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Return to Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left bg-gray-100 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-auto max-h-48">
                                <summary className="font-semibold cursor-pointer">Error Details (Dev Only)</summary>
                                <pre className="mt-2 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
