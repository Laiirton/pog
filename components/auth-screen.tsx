/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'

import { Login } from './login'
import { Register } from './register'

interface AuthScreenProps {
  onAuthSuccess: (username: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = (token: string) => {
    // Aqui você pode decodificar o token para obter o username, se necessário
    // Por simplicidade, vamos assumir que o token é o username
    onAuthSuccess(token);
  };

  const handleRegistrationSuccess = (username: string) => {
    onAuthSuccess(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {isLogin ? (
        <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onRegistrationSuccess={handleRegistrationSuccess} onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}