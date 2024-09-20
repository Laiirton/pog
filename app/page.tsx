/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react';
import { Welcome } from '../components/welcome';
import { RetroMediaGalleryComponent } from '../components/retro-media-gallery';
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

  const handleEnter = () => {
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
        <Welcome onEnter={handleEnter} />
      )}
    </main>
  );
}