import React from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

interface ImageFrameProps {
  src: string
  alt: string
  username: string
  createdAt: string
}

export function ImageFrame({ src, alt, username, createdAt }: ImageFrameProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = alt || 'image.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

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
        <p className="text-sm">Uploaded by: {username}</p>
        <p className="text-xs mt-1">Uploaded on: {formatDate(createdAt)}</p>
        <button
          onClick={handleDownload}
          className="mt-2 bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"
        >
          <Download size={20} className="mr-2" />
          Download
        </button>
      </div>
    </motion.div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}