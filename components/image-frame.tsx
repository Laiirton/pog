import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import Image from 'next/image'

interface ImageFrameProps {
  src: string
  alt: string
  username: string
  createdAt: string
  thumbnail: string // Adicionando thumbnail como prop
  preloaded?: boolean
  getCachedImage: (src: string) => string | null;
}

const getImageSrc = (src: string) => {
  if (src.includes('drive.google.com')) {
    const fileId = src.match(/\/d\/(.+?)\/view/)?.[1] || src.match(/id=(.+?)(&|$)/)?.[1];
    return fileId ? `/api/file/${fileId}` : src;
  }
  return src;
};

export function ImageFrame({ src, alt, username, createdAt, thumbnail, preloaded = false, getCachedImage }: ImageFrameProps) {
  const [isLoading, setIsLoading] = useState(!preloaded);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(preloaded ? src : thumbnail);
  const fullImageSrc = getImageSrc(src);
  const cachedImage = getCachedImage(fullImageSrc);

  useEffect(() => {
    if (!preloaded && !cachedImage) {
      const preloadImage = new window.Image();
      preloadImage.src = fullImageSrc;
      preloadImage.onload = () => {
        setCurrentSrc(fullImageSrc);
        setIsLoading(false);
      };
      preloadImage.onerror = () => {
        console.error('Error loading full image:', fullImageSrc);
        setImageError(true);
        setIsLoading(false);
      };
    } else if (cachedImage) {
      setCurrentSrc(cachedImage);
      setIsLoading(false);
    }
  }, [fullImageSrc, preloaded, cachedImage]);

  const handleDownload = async () => {
    try {
      const response = await fetch(fullImageSrc)
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
      className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-gradient-x"></div>
      <div className="absolute inset-[2px] bg-black rounded-lg overflow-hidden">
        <div className="relative w-full h-full aspect-square">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {!imageError ? (
            <Image
              src={currentSrc}
              alt={alt}
              layout="fill"
              objectFit="contain"
              className="transition-opacity duration-300"
              style={{ opacity: isLoading ? 0.5 : 1 }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-green-500">
              Failed to load image
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 text-green-500">
          <h2 className="text-xl font-bold mb-2 text-green-400 truncate">{alt}</h2>
          <p className="text-sm text-green-300">Uploaded by: <span className="text-green-400">{username}</span></p>
          <p className="text-xs mt-1 text-green-300">Uploaded on: <span className="text-green-400">{new Date(createdAt).toLocaleString()}</span></p>
          <button
            onClick={handleDownload}
            className="mt-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-black font-bold py-2 px-4 rounded transition-all duration-300 flex items-center"
          >
            <Download size={20} className="mr-2" />
            Download
          </button>
        </div>
      </div>
    </motion.div>
  )
}