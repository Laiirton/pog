/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MatrixRain } from './matrix-rain';
import { UserRanking } from './user-ranking';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';

interface WelcomeProps {
  onLogout: () => void;
}

export function Welcome({ onLogout }: WelcomeProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      <MatrixRain />
      <div className="relative z-10 flex flex-col h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Welcome to Pog Gallery</h1>
          <p className="text-xl">Experience the best of cyberpunk media sharing.</p>
        </motion.div>
        <div className="w-full max-w-4xl">
          <UserRanking />
        </div>
        <Button
          onClick={onLogout}
          className="mt-8 bg-red-600 hover:bg-red-700 text-white border border-red-300 shadow-lg shadow-red-500/50 transition-all duration-300"
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}