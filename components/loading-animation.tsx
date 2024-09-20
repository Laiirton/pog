/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';

export const LoadingAnimation: React.FC = () => {
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const circleVariants = {
    start: {
      y: '0%',
      opacity: 0,
    },
    end: {
      y: '100%',
      opacity: 1,
    },
  };

  const circleTransition = {
    duration: 0.8,
    yoyo: Infinity,
    ease: 'easeInOut',
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <motion.div
        className="flex space-x-4 mb-8"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.span
            key={index}
            className="w-4 h-4 bg-green-500 rounded-full"
            variants={circleVariants}
            transition={circleTransition}
            style={{
              filter: `blur(${index * 0.5}px)`,
              opacity: 1 - index * 0.2,
            }}
          />
        ))}
      </motion.div>
      <motion.h2
        className="text-green-500 text-3xl font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.5 }}
      >
        Pog Gallery
      </motion.h2>
    </div>
  );
};