import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  performance: boolean;
  marketing: boolean;
  customization: boolean;
}

const GV_CookieConsent: React.FC = () => {
  // Zustand hooks
  const authToken = useAppStore(state => state.authToken);
  const currentUser = useAppStore(state => state.currentUser);
  const addNotification = useAppStore(state => state.addNotification);
  const error = useAppStore(state => state.error);

  // Local state
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    performance: false,
    marketing: false,
    customization: false
  });

  // Check for existing preferences on mount
  useEffect(() => {
    // Check localStorage for existing preferences
    const savedPrefs = localStorage.getItem('cookiePreferences');
    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs);
        setCookiePreferences(parsedPrefs);
        setShowBanner(false); // Hide if we have saved prefs
      } catch (e) {
        localStorage.removeItem('cookiePreferences');
      }
    }

    // Load from server if authenticated
    if (authToken && currentUser) {
      refetchPreferences();
    }
  }, [authToken, currentUser]);

  // Save preferences to server
  const savePreferences = useMutation(async (prefs: CookiePreferences) => {
    if (!authToken) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        cookie_preferences: Object.entries(prefs)
          .filter(([key, value]) => value && key !== 'necessary') // Always include necessary
          .map(([key]) => key)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save preferences');
    }
    return response.json();
  }, {
    onSuccess: () => {
      addNotification({
        type: 'success',
        message: 'Cookie preferences updated successfully'
      });
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to save preferences'
      });
    }
  });

  // Load preferences from server
  const { refetch: refetchPreferences } = useQuery({
    queryKey: ['cookie_preferences'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/cookie-settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }
      return response.json();
    },
    enabled: !!authToken,
    onSuccess: (data) => {
      if (data.cookie_preferences) {
        const newPrefs = {
          necessary: true, // Always necessary
          analytics: false,
          performance: false,
          marketing: false,
          customization: false,
          ...data.cookie_preferences
        };
        setCookiePreferences(newPrefs);
        localStorage.setItem('cookiePreferences', JSON.stringify(newPrefs));
      }
    },
    onError: (error: Error) => {
      console.error('Failed to load preferences', error);
    }
  });

  // Handler for preference changes
  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    setCookiePreferences(prev => ({
      ...prev,
      [key]: key === 'necessary' ? true : value // Force necessary to stay true
    }));
  };

  // Save settings to both client and server (if authenticated)
  const saveAndClose = () => {
    const prefsToSave = {
      ...cookiePreferences
    };

    // Save to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(prefsToSave));
    
    // Save to server if authenticated
    if (authToken) {
      savePreferences.mutate(prefsToSave);
    }

    // Close the banner
    setShowBanner(false);
    setExpanded(false);

    // Trigger cookie setup (hypothetical function)
    // initializeCookies(cookiePreferences);
  };

  // Handler for Accept All
  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      performance: true,
      marketing: true,
      customization: true
    };
    setCookiePreferences(allAccepted);
    saveAndClose();
  };

  // Handler for Reject All
  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      performance: false,
      marketing: false,
      customization: false
    };
    setCookiePreferences(onlyNecessary);
    saveAndClose();
  };

  // Don't render if banner is dismissed
  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${expanded ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setExpanded(false)}
      />

      {/* Cookie Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          expanded ? '' : 'translate-y-0'
        }`}
        style={{ zIndex: 50 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Cookie Preferences
              </h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, analyze site traffic, and serve targeted ads. 
                By clicking "Accept All", you consent to our use of cookies. Check out our{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>{' '}
                for more details.
              </p>
              
              {/* Advanced Settings Panel */}
              {expanded && (
                <div className="mt-4 space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="necessary"
                      checked={cookiePreferences.necessary}
                      disabled
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="necessary" className="text-gray-900">
                        Necessary Cookies
                      </label>
                      <p className="text-xs text-gray-500">
                        Required for basic site functionality. Cannot be turned off.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={cookiePreferences.analytics}
                      onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="analytics" className="text-gray-900">
                        Analytics Cookies
                      </label>
                      <p className="text-xs text-gray-500">
                        Help us improve our website by collecting anonymized usage data.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="performance"
                      checked={cookiePreferences.performance}
                      onChange={(e) => handlePreferenceChange('performance', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="performance" className="text-gray-900">
                        Performance Cookies
                      </label>
                      <p className="text-xs text-gray-500">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={cookiePreferences.marketing}
                      onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="marketing" className="text-gray-900">
                        Marketing Cookies
                      </label>
                      <p className="text-xs text-gray-500">
                        Used to track visitors across websites to deliver relevant ads.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="customization"
                      checked={cookiePreferences.customization}
                      onChange={(e) => handlePreferenceChange('customization', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="customization" className="text-gray-900">
                        Personalization Cookies
                      </label>
                      <p className="text-xs text-gray-500">
                        Remember your preferences and improve your experience.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
              {!expanded ? (
                <>
                  <button
                    onClick={() => setExpanded(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Customize Preferences
                  </button>
                  <button
                    onClick={acceptAll}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none"
                  >
                    Accept All
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={rejectAll}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none"
                  >
                    Reject All Non-Essential
                  </button>
                  <button
                    onClick={saveAndClose}
                    disabled={savePreferences.isLoading}
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-wait transition-colors"
                  >
                    {savePreferences.isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Preferences'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error handling */}
      {error && (
        <div className="fixed bottom-20 left-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 max-w-md opacity-95 transition-all duration-300 ease-in-out">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GV_CookieConsent;