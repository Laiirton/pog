/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MatrixRain } from './matrix-rain';
import { UserRanking } from './user-ranking';
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';

interface WelcomeProps {
  onEnter: () => void;
}

export function Welcome({ onEnter }: WelcomeProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-cyan-500 text-2xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-cyan-500 font-mono relative overflow-hidden">
      <MatrixRain />
      <div className="relative z-10 flex flex-col h-screen items-center justify-center p-8">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-6xl font-bold mb-8 text-cyan-300 text-center"
        >
          Welcome to Pog Gallery
        </motion.h1>
        <div className="flex w-full max-w-7xl gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="w-1/2"
          >
            <div className="bg-gray-900 bg-opacity-70 p-6 rounded-lg shadow-lg mb-8">
              <p className="text-lg mb-4 text-cyan-100">
                Step into the digital realm of Pog Gallery, where cyberpunk aesthetics meet cutting-edge media sharing.
              </p>
              <p className="text-lg mb-4 text-cyan-200">
                Your uploads become digital artifacts in a world of bits and pixels.
              </p>
              <p className="text-lg mb-4 text-cyan-300">
                Join our cyber community and leave your mark on the Pog Gallery grid.
              </p>
              <p className="text-sm italic text-cyan-400 mt-4">
                Created by anjinho ruindade pura 😈
              </p>
            </div>
            <Button
              onClick={onEnter}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-black border border-cyan-300 shadow-lg shadow-cyan-500/50 transition-all duration-300 text-lg py-3"
            >
              <LogIn size={24} className="mr-2" />
              Enter Gallery
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
            className="w-1/2"
          >
            <UserRanking />
          </motion.div>
        </div>
      </div>
    </div>
  );
}