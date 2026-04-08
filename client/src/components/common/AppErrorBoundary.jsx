import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Something went wrong while rendering this page.',
    };
  }

  componentDidCatch(error) {
    console.error('Route render error:', error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        errorMessage: '',
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[320px] items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-xl border border-[#3a3a4a] bg-[#252537] p-8 text-center shadow-xl">
          <h2 className="mb-2 text-xl font-semibold text-white">This page hit an error</h2>
          <p className="mb-6 text-sm text-[#9ca3af]">
            The app shell is still running. You can retry this page or switch to another section.
          </p>
          <p className="mb-6 break-words rounded-lg border border-[#33334a] bg-[#1E1E2E] px-4 py-3 text-sm text-[#d1d5db]">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg bg-[#4F8EF7] px-4 py-2 text-sm text-white transition-colors hover:bg-[#3D7DE6]"
          >
            Retry Page
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
