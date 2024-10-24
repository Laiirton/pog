/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, User, Lock, AlertCircle } from 'lucide-react';

// Interface para as propriedades do componente AdminLogin
interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onClose: () => void;
}

// Componente de Login do Administrador
export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  // Estados para armazenar o username e password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onLogin(username, password);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md"
        >
          {/* Efeito de borda brilhante */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-lg opacity-50 blur-md animate-pulse" />
          
          {/* Container principal */}
          <div className="relative bg-black border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/20">
            {/* Botão de fechar */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute -top-4 -right-4 w-8 h-8 bg-black rounded-full border-2 border-green-500 text-green-500 hover:text-green-400 hover:border-green-400 transition-colors flex items-center justify-center"
            >
              <X size={18} />
            </motion.button>

            {/* Cabeçalho */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="flex justify-center mb-4"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500">
                  <LogIn className="w-8 h-8 text-green-500" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-green-500 tracking-wider"
              >
                ADMIN ACCESS
              </motion.h2>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500 to-transparent mt-4"
              />
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de usuário */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500/50" size={18} />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-black/50 text-green-500 border-2 border-green-500/50 rounded-lg py-3 px-10 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-green-500/30"
                />
              </div>

              {/* Campo de senha */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500/50" size={18} />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-black/50 text-green-500 border-2 border-green-500/50 rounded-lg py-3 px-10 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-green-500/30"
                />
              </div>

              {/* Mensagem de erro */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-red-500 text-sm"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botões */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition-colors relative overflow-hidden ${
                    isLoading ? 'cursor-wait' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-black border-t-transparent rounded-full"
                      />
                    </span>
                  ) : (
                    'Access System'
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="w-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold py-3 px-4 rounded-lg transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </form>

            {/* Decoração inferior */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500 to-transparent mt-8"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
