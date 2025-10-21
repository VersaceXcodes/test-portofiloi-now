import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import GV_Header from '@/components/views/GV_Header.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import GV_ContactModal from '@/components/views/GV_ContactModal.tsx';
import GV_CookieConsent from '@/components/views/GV_CookieConsent.tsx';

// Import pages with React.lazy for code splitting
const UV_Homepage = lazy(() => import('@/components/views/UV_Homepage'));
const UV_About = lazy(() => import('@/components/views/UV_About'));
const UV_Portfolio = lazy(() => import('@/components/views/UV_Portfolio'));
const UV_ProjectDetail = lazy(() => import('@/components/views/UV_ProjectDetail'));
const UV_Resume = lazy(() => import('@/components/views/UV_Resume'));
const UV_Contact = lazy(() => import('@/components/views/UV_Contact'));

// Initialize Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  }
});

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
  </div>
);

// Error Boundary (simplified)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught in boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
            <p className="mb-4">We're having trouble loading the page. Please try refreshing or contact support if the problem persists.</p>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  // Zustand state
  const [initComplete, setInitComplete] = React.useState(false);
  const isCheckingAuth = useAppStore(state => state.isLoading);
  const checkAuth = useAppStore(state => state.checkAuth);

  // Initialize authentication on app load
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuth();
      } finally {
        setInitComplete(true);
      }
    };
    
    initializeApp();
  }, [checkAuth]);

  // Show loading spinner until initial auth check completes
  if (!initComplete || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Router>
          <GV_Header />
          
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <main className="flex-grow pt-16 pb-16"> {/* Adjust padding based on header/footer height */}
                <Routes>
                  <Route path="/" element={<UV_Homepage />} />
                  <Route path="/about" element={<UV_About />} />
                  <Route path="/portfolio" element={<UV_Portfolio />} />
                  <Route path="/projects/:id" element={<UV_ProjectDetail />} />
                  <Route path="/resume" element={<UV_Resume />} />
                  <Route path="/contact" element={<UV_Contact />} />
                  
                  {/* Catch-all route redirects to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </Suspense>
          </ErrorBoundary>

          <GV_Footer />
          <GV_ContactModal />
          <GV_CookieConsent />
        </Router>
      </div>
    </QueryClientProvider>
  );
};

export default App;