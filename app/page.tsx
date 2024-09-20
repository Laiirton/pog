/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react';
import { Welcome } from '../components/welcome';
import { RetroMediaGalleryComponent } from '../components/retro-media-gallery';
import { LoadingAnimation } from '../components/loading-animation';
import { AuthScreen } from '../components/auth-screen';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const storedUsername = localStorage.getItem('username');
      setIsAuthenticated(!!storedUsername);
      setIsLoading(false);
    };

    checkUser();
  }, []);

  const handleEnter = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = (username: string) => {
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setShowAuth(true);
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (showAuth) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <main>
      {isAuthenticated ? (
        <RetroMediaGalleryComponent onLogout={handleLogout} />
      ) : (
        <Welcome onEnter={handleEnter} />
      )}
    </main>
  );
}