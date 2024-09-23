/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const LoadingAnimation: React.FC = () => {
  const [glitchText, setGlitchText] = useState('POG GALLERY');
  const controls = useAnimation();

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
      const newText = 'POG GALLERY'.split('').map((char, index) => 
        Math.random() > 0.8 ? chars[Math.floor(Math.random() * chars.length)] : char
      ).join('');
      setGlitchText(newText);
    }, 100);

    return () => clearInterval(glitchInterval);
  }, []);

  useEffect(() => {
    controls.start({
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 2, repeat: Infinity }
    });
  }, [controls]);

  const containerVariants = {
    start: { opacity: 0 },
    end: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    start: { scale: 0, opacity: 0 },
    end: { scale: 1, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        className="relative"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        <motion.div
          className="absolute inset-0 bg-green-500 opacity-20 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.h1
          className="text-6xl font-bold text-green-500 mb-8 relative z-10"
          animate={controls}
        >
          {glitchText.split('').map((char, index) => (
            <motion.span
              key={index}
              variants={itemVariants}
              style={{
                display: 'inline-block',
                textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>
      </motion.div>

      <motion.div
        className="mt-12 flex space-x-4"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 bg-green-500 rounded-full"
            variants={itemVariants}
            animate={{
              y: ['0%', '100%', '0%'],
              opacity: [1, 0.5, 1],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.div>

      <motion.p
        className="mt-8 text-green-400 text-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Loading...
      </motion.p>
    </div>
  );
};