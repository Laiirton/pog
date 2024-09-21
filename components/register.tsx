/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { MatrixRain } from './matrix-rain'

interface RegisterProps {
  onRegisterSuccess: (token: string) => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        onRegisterSuccess(data.token);
      } else {
        setError(data.error || 'Falha no registro');
      }
    } catch (err) {
      console.error('Erro durante o registro:', err);
      setError('Ocorreu um erro inesperado');
    }

    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <MatrixRain />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="bg-black bg-opacity-80 p-8 rounded-lg border-2 border-green-400 shadow-lg shadow-green-500/30">
          <h2 className="text-3xl font-bold mb-6 text-green-400 text-center">Registro</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <div className="mb-4 relative">
            <label htmlFor="username" className="block text-green-300 mb-2">Usuário</label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Digite seu usuário"
                className="bg-black text-green-300 border-green-500 focus:border-green-300 pl-10"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
            </div>
          </div>
          <div className="mb-6 relative">
            <label htmlFor="password" className="block text-green-300 mb-2">Senha</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
                className="bg-black text-green-300 border-green-500 focus:border-green-300 pl-10 pr-10"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            {isLoading ? 'Registrando...' : 'Registrar'}
          </Button>
          <p className="text-sm text-green-400 mt-4 text-center">
            Já tem uma conta?{' '}
            <button onClick={onSwitchToLogin} className="text-blue-400 hover:underline">
              Faça login aqui
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  )
}