/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { MatrixRain } from './matrix-rain'

// Interface para as propriedades do componente Login
interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onSwitchToRegister: () => void;
}

// Componente de Login
export function Login({ onLoginSuccess, onSwitchToRegister }: LoginProps) {
  // Estados para armazenar o username, password, visibilidade do password, erro e estado de carregamento
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

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Envia uma requisição POST para a API de login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Armazena o token e o username no localStorage e chama a função de sucesso
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        onLoginSuccess(data.token);
      } else {
        // Define a mensagem de erro caso o login falhe
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('An unexpected error occurred');
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
          <h2 className="text-3xl font-bold mb-6 text-green-400 text-center">Login</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <div className="mb-4 relative">
            <label htmlFor="username" className="block text-green-300 mb-2">Username</label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="bg-black text-green-300 border-green-500 focus:border-green-300 pl-10"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
            </div>
          </div>
          <div className="mb-6 relative">
            <label htmlFor="password" className="block text-green-300 mb-2">Password</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
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
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-sm text-green-400 mt-4 text-center">
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="text-blue-400 hover:underline">
              Register here
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  )
}