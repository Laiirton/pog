'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Login } from './login'
import { Register } from './register'
import { MatrixRain } from './matrix-rain'
import { UserRanking } from './user-ranking'

interface AuthScreenProps {
  onAuthSuccess: (username: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [showLogin, setShowLogin] = useState(true)
  const [showIntro, setShowIntro] = useState(true)

  const handleAuthSuccess = (username: string) => {
    onAuthSuccess(username);
  };

  const handleContinue = () => {
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">
      <MatrixRain />
      <AnimatePresence>
        {showIntro ? (
          <IntroScreen onContinue={handleContinue} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full max-w-md"
          >
            {showLogin ? (
              <Login
                onLoginSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setShowLogin(false)}
              />
            ) : (
              <Register
                onRegistrationSuccess={handleAuthSuccess}
                onSwitchToLogin={() => setShowLogin(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg border-2 border-green-500 w-full max-w-6xl z-10 text-green-400 flex flex-col md:flex-row gap-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <MatrixRain />
      </div>
      <div className="md:w-2/3 relative z-10">
        <motion.h1
          className="text-6xl font-bold mb-6 text-center md:text-left glitch-text"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          data-text="Welcome to Pog Gallery"
        >
          Welcome to Pog Gallery
        </motion.h1>
        <motion.div
          className="space-y-4 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="leading-relaxed">
            Step into the digital realm of Pog Gallery, where the retro-futuristic aesthetics of cyberpunk meet the cutting-edge world of media sharing.
          </p>
          <p className="leading-relaxed">
            In this neon-lit corner of the internet, your images and videos become more than just files – they're digital artifacts in a world where bits and pixels reign supreme.
          </p>
          <p className="leading-relaxed">
            Upload your media, and watch as it becomes part of our ever-growing digital tapestry. Each file you share adds to the collective consciousness of our cyber community.
          </p>
          <p className="leading-relaxed">
            But beware, in this digital frontier, your username is your identity, your password is your key, and your uploads are your legacy. Choose wisely, upload boldly, and leave your mark on the Pog Gallery grid.
          </p>
          <motion.p
            className="text-green-300 font-bold italic relative mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="glitch-text text-xl" data-text="Created by Anjinho Ruindade Pura 😈">
              Created by Anjinho Ruindade Pura 😈
            </span>
          </motion.p>
        </motion.div>
        <div className="flex justify-center md:justify-start mt-8">
          <motion.button
            onClick={onContinue}
            className="bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-md transition-colors duration-300 ease-in-out transform hover:scale-105 relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Enter the Grid</span>
            <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </motion.button>
        </div>
      </div>
      <div className="md:w-1/3 relative z-10">
        <UserRanking />
      </div>
    </motion.div>
  )
}