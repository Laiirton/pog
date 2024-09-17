import React from 'react'
import { motion } from 'framer-motion'

interface ImageFrameProps {
  src: string
  alt: string
  username: string
  createdAt: string
}

export function ImageFrame({ src, alt, username, createdAt }: ImageFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full h-full bg-black border-4 border-green-500 rounded-lg overflow-hidden shadow-lg"
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 text-green-500">
        <h2 className="text-xl font-bold mb-2">{alt}</h2>
        <p className="text-sm">Enviado por: {username}</p>
        <p className="text-xs mt-1">Enviado em: {formatDate(createdAt)}</p>
      </div>
    </motion.div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}