'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Login } from './login'
import { Register } from './register'
import { MatrixRain } from './matrix-rain'

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [showLogin, setShowLogin] = useState(true)
  const [showIntro, setShowIntro] = useState(true)

  const handleContinue = () => {
    setShowIntro(false)
  }

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
            className="z-10"
          >
            {showLogin ? (
              <Login
                onLoginSuccess={onAuthSuccess}
                onSwitchToRegister={() => setShowLogin(false)}
              />
            ) : (
              <Register
                onRegistrationSuccess={onAuthSuccess}
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
      className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg border border-green-500 w-full max-w-2xl z-10 text-green-500"
    >
      <motion.h1
        className="text-5xl font-bold mb-6 text-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        Welcome to Pog Gallery
      </motion.h1>
      <motion.div
        className="space-y-4 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p>
          Step into the digital realm of Pog Gallery, where the retro-futuristic aesthetics of cyberpunk meet the cutting-edge world of media sharing.
        </p>
        <p>
          In this neon-lit corner of the internet, your images and videos become more than just files – they're digital artifacts in a world where bits and pixels reign supreme.
        </p>
        <p>
          Upload your media, and watch as it becomes part of our ever-growing digital tapestry. Each file you share adds to the collective consciousness of our cyber community.
        </p>
        <p>
          But beware, in this digital frontier, your username is your identity, your password is your key, and your uploads are your legacy. Choose wisely, upload boldly, and leave your mark on the Pog Gallery grid.
        </p>
      </motion.div>
      <motion.button
        onClick={onContinue}
        className="mt-8 w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-md transition-colors duration-300 ease-in-out transform hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Enter the Grid
      </motion.button>
    </motion.div>
  )
}