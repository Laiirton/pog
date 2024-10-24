/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

// Importando os hooks e componentes necessários
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MatrixRain } from './matrix-rain';
import { UserRanking } from './user-ranking';
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';
import { LoadingAnimation } from './loading-animation'; // Importe o novo componente

// Definindo a interface para as props do componente Welcome
interface WelcomeProps {
  onEnter: () => void;
}

// Componente principal Welcome
export function Welcome({ onEnter }: WelcomeProps) {
  // Estado para controlar o carregamento inicial
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para simular um carregamento de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Aumentamos para 2 segundos para dar tempo de ver a animação

    // Limpeza do timer quando o componente é desmontado
    return () => clearTimeout(timer);
  }, []);

  // Renderiza a nova animação de carregamento enquanto isLoading for true
  if (isLoading) {
    return <LoadingAnimation />;
  }

  // Renderização principal do componente
  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono relative overflow-hidden">
      {/* Componente de efeito visual de "chuva de matrix" */}
      <MatrixRain />
      <div className="relative z-10 flex flex-col h-screen items-center justify-center p-8 overflow-y-auto">
        {/* Título animado */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-6xl font-bold mb-8 text-green-400 text-center mt-20 md:mt-0"
        >
          Welcome to Pog Gallery
        </motion.h1>
        <div className="flex flex-col md:flex-row w-full max-w-7xl gap-8">
          {/* Seção de informações e botão de entrada */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="w-full md:w-1/2"
          >
            <div className="bg-blue-900 bg-opacity-20 p-6 rounded-lg shadow-lg mb-8 border border-cyan-500">
              <p className="text-lg mb-4 text-cyan-200">
                Step into the digital realm of Pog Gallery, where cyberpunk aesthetics meet cutting-edge media sharing.
              </p>
              <p className="text-lg mb-4 text-cyan-300">
                Your uploads become digital artifacts in a world of bits and pixels.
              </p>
              <p className="text-lg mb-4 text-cyan-400">
                Join our cyber community and leave your mark on the Pog Gallery grid.
              </p>
              <p className="text-sm italic text-green-500 mt-4">
                Created by anjinho ruindade pura 😈
              </p>
            </div>
            {/* Botão para entrar na galeria */}
            <Button
              onClick={onEnter}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black border border-cyan-300 shadow-lg shadow-cyan-500/50 transition-all duration-300 text-lg py-3"
            >
              <LogIn size={24} className="mr-2" />
              Enter Gallery
            </Button>
          </motion.div>
          {/* Componente de ranking de usuários */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
            className="w-full md:w-1/2 overflow-y-auto max-h-[50vh] md:max-h-full"
          >
            <UserRanking />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
