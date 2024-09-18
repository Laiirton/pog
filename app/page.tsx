'use client'

import { RetroMediaGalleryComponent } from '../components/retro-media-gallery';
import { Register } from '../components/register';
import { useState, useEffect } from 'react';

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
    return <div className="text-green-500 text-center">Carregando...</div>;
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