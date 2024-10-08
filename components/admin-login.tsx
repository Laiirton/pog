/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';

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

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    // Container principal com estilo de tela cheia e centralização de conteúdo
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-black border border-green-500 rounded-lg p-6 relative max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-green-500">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo de input para o username */}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 mb-4 bg-black text-green-500 border border-green-500 rounded"
          />
          {/* Campo de input para o password */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 mb-4 bg-black text-green-500 border border-green-500 rounded"
          />
          {/* Botão de envio do formulário */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Login
          </button>
        </form>
        {/* Botão para cancelar e fechar o modal */}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};