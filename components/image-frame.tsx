/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import Image from 'next/image'

// Interface para as propriedades do componente ImageFrame
interface ImageFrameProps {
  src: string
  alt: string
  username: string
  createdAt: string
  thumbnail: string
  preloaded?: boolean
  getCachedImage: (src: string) => string | null
}

// Função para obter a URL da imagem, tratando links do Google Drive
const getImageSrc = (src: string): string => {
  if (src.includes('drive.google.com')) {
    const fileId = src.match(/\/d\/(.+?)\/view/)?.[1] || src.match(/id=(.+?)(&|$)/)?.[1]
    return `/api/proxy-image?id=${fileId}`
  }
  return src
}

// Componente principal ImageFrame
export function ImageFrame({ src, alt, username, createdAt, thumbnail, preloaded = false, getCachedImage }: ImageFrameProps) {
  // Estados para controlar o carregamento e erro da imagem
  const [isLoading, setIsLoading] = useState(!preloaded)
  const [imageError, setImageError] = useState(false)
  const fullImageSrc = getImageSrc(src)
  const cachedImage = getCachedImage(fullImageSrc)

  // Efeito para carregar a imagem
  useEffect(() => {
    if (!preloaded && !cachedImage) {
      const img = new window.Image()
      img.src = fullImageSrc
      img.onload = () => setIsLoading(false)
      img.onerror = () => {
        console.error('Error loading image:', fullImageSrc)
        setImageError(true)
        setIsLoading(false)
      }
    } else if (cachedImage) {
      setIsLoading(false)
    }
  }, [fullImageSrc, preloaded, cachedImage])

  // Função para lidar com o download da imagem
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
      {/* Gradiente de fundo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 animate-gradient-x"></div>
      <div className="absolute inset-[2px] bg-black rounded-lg overflow-hidden">
        <div className="relative w-full h-full aspect-square">
          {/* Indicador de carregamento */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {/* Exibição da imagem ou mensagem de erro */}
          {!imageError ? (
            <Image
              src={cachedImage || fullImageSrc}
              alt={alt}
              layout="fill"
              objectFit="contain"
              className="transition-opacity duration-300"
              style={{ opacity: isLoading ? 0.5 : 1 }}
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-green-500">
              Failed to load image
            </div>
          )}
        </div>
        {/* Informações da imagem e botão de download */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4 text-green-500">
          <h2 className="text-xl font-bold mb-2 text-green-400 truncate">{alt}</h2>
          <p className="text-sm text-green-300">
            Uploaded by: <span className="text-green-400 font-bold">{username || 'Unknown'}</span>
          </p>
          <p className="text-xs mt-1 text-green-300">
            Uploaded on: <span className="text-green-400">{new Date(createdAt).toLocaleString()}</span>
          </p>
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