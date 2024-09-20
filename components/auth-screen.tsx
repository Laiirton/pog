/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

// Importa o hook useState do React
import { useState } from 'react'

// Importa os componentes Login e Register
import { Login } from './login'
import { Register } from './register'

// Define a interface para as propriedades do componente AuthScreen
interface AuthScreenProps {
  onAuthSuccess: (username: string) => void;
}

// Componente principal AuthScreen
export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  // Estado para controlar se a tela atual é de login ou registro
  const [isLogin, setIsLogin] = useState(true);

  // Função chamada quando o login é bem-sucedido
  const handleLoginSuccess = (token: string) => {
    // Aqui você pode decodificar o token para obter o username, se necessário
    // Por simplicidade, vamos assumir que o token é o username
    onAuthSuccess(token);
  };

  // Função chamada quando o registro é bem-sucedido
  const handleRegistrationSuccess = (username: string) => {
    onAuthSuccess(username);
  };

  return (
    // Container principal com estilo de tela cheia e centralização de conteúdo
    <div className="min-h-screen flex items-center justify-center bg-black">
      {isLogin ? (
        // Renderiza o componente de Login se isLogin for verdadeiro
        <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        // Renderiza o componente de Register se isLogin for falso
        <Register onRegistrationSuccess={handleRegistrationSuccess} onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}