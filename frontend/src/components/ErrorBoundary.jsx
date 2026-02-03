import React from 'react';
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-center">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 text-left bg-gray-100 dark:bg-gray-950 p-3 rounded text-xs font-mono overflow-auto max-h-32 text-red-800 dark:text-red-300">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <Button onClick={this.handleReload} className="w-full gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
