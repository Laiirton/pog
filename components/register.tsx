/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

// Importações necessárias
import { useState } from 'react'

import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from 'lucide-react'

// Interface para as props do componente Register
interface RegisterProps {
  onRegistrationSuccess: (username: string) => void;
  onSwitchToLogin: () => void;
}

// Componente principal de registro
export function Register({ onRegistrationSuccess, onSwitchToLogin }: RegisterProps) {
  // Estados para armazenar os valores dos campos e controlar o estado do componente
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
      // Envia os dados de registro para a API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Chama a função de sucesso no registro
        onRegistrationSuccess(username);
      } else {
        // Define a mensagem de erro caso o registro falhe
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Error during registration:', err);
      setError('An unexpected error occurred');
    }

    setIsLoading(false);
  };

  return (
    // Formulário de registro com animação
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-black bg-opacity-80 p-6 rounded-lg border-2 border-green-400 shadow-lg shadow-green-500/30"
    >
      <h2 className="text-2xl font-bold mb-4 text-green-400">Register</h2>
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
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
      <p className="mt-4 text-center text-green-300">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="underline">
          Login
        </button>
      </p>
    </motion.form>
  )
}