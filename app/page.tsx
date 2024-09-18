'use client'

import { RetroMediaGalleryComponent } from '../components/retro-media-gallery';
import { Register } from '../components/register';
import { useState, useEffect } from 'react';
import { LoadingAnimation } from '../components/retro-media-gallery'; // Importe o LoadingAnimation

export default function Home() {
  const [showRegister, setShowRegister] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      setIsLoading(true);
      const storedUsername = localStorage.getItem('username');
      setShowRegister(!storedUsername);
      setIsLoading(false);
    };

    checkUser();
    window.addEventListener('storage', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleRegistrationComplete = () => {
    setShowRegister(false);
  };

  if (isLoading) {
    return <LoadingAnimation />; // Use o LoadingAnimation aqui
  }

  return (
    <main>
      {showRegister ? (
        <Register onRegistrationComplete={handleRegistrationComplete} />
      ) : (
        <RetroMediaGalleryComponent />
      )}
    </main>
  );
}