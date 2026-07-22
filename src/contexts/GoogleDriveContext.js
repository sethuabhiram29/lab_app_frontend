import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleDriveContext = createContext();

export const GoogleDriveProvider = ({ children }) => {
  const [driveAuthorized, setDriveAuthorized] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [driveAuthError, setDriveAuthError] = useState('');

  useEffect(() => {
    // Check for existing token and its validity on mount
    const checkExistingAuth = () => {
      const token = localStorage.getItem('googleDriveAccessToken');
      const expiry = parseInt(localStorage.getItem('googleDriveTokenExpiry') || '0');
      
      if (token && expiry > Date.now()) {
        setDriveAuthorized(true);
      } else {
        // Clear invalid tokens
        localStorage.removeItem('googleDriveAccessToken');
        localStorage.removeItem('googleDriveAuthState');
        localStorage.removeItem('googleDriveTokenTimestamp');
        localStorage.removeItem('googleDriveTokenExpiry');
        setDriveAuthorized(false);
      }
    };

    checkExistingAuth();
  }, []);

  const handleSignIn = (callback) => {
    if (!tokenClient) {
      setDriveAuthError('Token client not initialized');
      return;
    }

    try {
      // Clear old cached tokens to ensure clean account picker
      localStorage.removeItem('googleDriveAccessToken');
      localStorage.removeItem('googleDriveAuthState');
      setDriveAuthorized(false);
      setDriveAuthError('');

      tokenClient.requestAccessToken({ prompt: 'select_account' });
      if (callback) callback();
    } catch (error) {
      console.error('Google Drive auth error:', error);
      setDriveAuthError(error.message || 'Failed to authorize Google Drive');
    }
  };

  const handleSignOut = () => {
    const token = localStorage.getItem('googleDriveAccessToken');
    
    // Clean up all Google Drive related storage
    localStorage.removeItem('googleDriveAccessToken');
    localStorage.removeItem('googleDriveAuthState');
    localStorage.removeItem('googleDriveTokenTimestamp');
    localStorage.removeItem('googleDriveTokenExpiry');
    
    // Update state
    setDriveAuthorized(false);
    setTokenClient(null);
    setDriveAuthError('');
    
    // Properly revoke token
    if (window.google?.accounts?.oauth2?.revoke && token) {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('Token revoked successfully');
      });
    }
  };

  const initializeTokenClient = (clientConfig) => {
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        ...clientConfig,
        prompt: 'select_account',
        callback: (response) => {
          if (response.error) {
            setDriveAuthError(response.error);
            return;
          }
          
          localStorage.setItem('googleDriveAccessToken', response.access_token);
          localStorage.setItem('googleDriveTokenTimestamp', Date.now().toString());
          localStorage.setItem('googleDriveTokenExpiry', (Date.now() + (3600 * 1000)).toString());
          localStorage.setItem('googleDriveAuthState', 'true');
          setDriveAuthorized(true);
          setDriveAuthError('');
        },
      });
      setTokenClient(client);
    }
  };

  const value = {
    driveAuthorized,
    tokenClient,
    driveAuthError,
    handleSignIn,
    handleSignOut,
    initializeTokenClient
  };

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  );
};

export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
