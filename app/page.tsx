'use client'

import { RetroMediaGalleryComponent } from '../components/retro-media-gallery';
import { AuthScreen } from '../components/auth-screen';
import { useState, useEffect } from 'react';
import { LoadingAnimation } from '../components/loading-animation';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const storedUsername = localStorage.getItem('username');
      setIsAuthenticated(!!storedUsername);
      setIsLoading(false);
    };

    checkUser();
  }, []);

  const handleAuthSuccess = (username: string) => {
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <main>
      {isAuthenticated ? (
        <RetroMediaGalleryComponent onLogout={handleLogout} />
      ) : (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
    </main>
  );
}