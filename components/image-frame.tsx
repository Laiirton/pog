import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import Image from 'next/image'

interface ImageFrameProps {
  src?: string
  alt?: string
  username?: string
  createdAt?: string
  onLoad?: () => void
  onError?: () => void
  className?: string
  placeholder?: string
}

const getImageSrc = (src?: string) => {
  if (!src) return '';
  if (src.includes('drive.google.com')) {
    const fileId = src.match(/\/d\/(.+?)\/view/)?.[1];
    return fileId ? `/api/file/${fileId}` : src;
  }
  return src;
};

export function ImageFrame({ src, alt, username, createdAt, onLoad, onError, className, placeholder }: ImageFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(placeholder || null);

  useEffect(() => {
    const img = new window.Image();
    img.src = getImageSrc(src) || '';
    img.onload = () => {
      setImageSrc(img.src);
      setIsLoading(false);
      onLoad && onLoad();
    };
    img.onerror = () => {
      setIsLoading(false);
      onError && onError();
    };
  }, [src, onLoad, onError]);

  const handleDownload = async () => {
    if (!imageSrc) return;
    try {
      const response = await fetch(imageSrc)
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
      className={`relative w-full h-full bg-black rounded-lg overflow-hidden shadow-lg ${className || ''}`}
    >
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={alt || ''}
            layout="fill"
            objectFit="contain"
            className="transition-opacity duration-300"
            priority
            placeholder="blur"
            blurDataURL={placeholder}
          />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent pt-20 pb-4 px-4">
        {alt && <h2 className="text-xl font-bold mb-2 text-green-400">{alt}</h2>}
        {username && <p className="text-sm text-green-300">Uploaded by: <span className="text-green-400">{username}</span></p>}
        {createdAt && <p className="text-xs mt-1 text-green-300">Uploaded on: <span className="text-green-400">{formatDate(createdAt)}</span></p>}
        <button
          onClick={handleDownload}
          className="mt-3 bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"
        >
          <Download size={20} className="mr-2" />
          Download
        </button>
      </div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-300 to-green-500 animate-pulse"></div>
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-green-300 to-green-500 animate-pulse"></div>
      <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-green-300 to-green-500 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-300 to-green-500 animate-pulse"></div>
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