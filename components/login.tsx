/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from 'lucide-react'

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
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-black bg-opacity-80 p-6 rounded-lg border-2 border-green-400 shadow-lg shadow-green-500/30"
    >
      <h2 className="text-2xl font-bold mb-4 text-green-400">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label htmlFor="username" className="block text-green-300 mb-1">Username</label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Enter your username"
          className="bg-black text-green-300 border-green-500 focus:border-green-300"
        />
      </div>
      <div className="mb-4 relative">
        <label htmlFor="password" className="block text-green-300 mb-1">Password</label>
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          className="bg-black text-green-300 border-green-500 focus:border-green-300"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute top-9 right-3 text-green-300"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full flex items-center justify-center">
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
      <p className="text-sm text-green-400 mt-2">
        Don&apos;t have an account?{' '}
        <button onClick={onSwitchToRegister} className="text-blue-400 hover:underline">
          Register here
        </button>
      </p>
    </motion.form>
  )
}