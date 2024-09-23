/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, User, Calendar, Info, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from "@/components/ui/button" // Adicione esta importação

// Interface para as propriedades do componente ImageFrame
interface ImageFrameProps {
  src: string
  alt: string
  username: string
  createdAt: string
  thumbnail: string
  preloaded?: boolean
  getCachedImage: (src: string) => string | null
  onClose: () => void // Adicione esta linha
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
export function ImageFrame({ src, alt, username, createdAt, thumbnail, preloaded = false, getCachedImage, onClose }: ImageFrameProps) {
  // Estados para controlar o carregamento e erro da imagem
  const [isLoading, setIsLoading] = useState(!preloaded)
  const [imageError, setImageError] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
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
      
      {/* Botão de fechar */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-2 right-2 text-green-500 hover:bg-green-900 hover:bg-opacity-50 z-50"
        aria-label="Fechar imagem"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="absolute inset-[2px] bg-black rounded-lg overflow-hidden flex flex-col">
        <div className="relative flex-grow">
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
        {/* Informações da imagem e botões */}
        <div className="p-4 bg-gradient-to-t from-black to-transparent">
          <div className="flex flex-col justify-between items-start">
            <div className="w-full mb-2">
              <h2 className="text-xl font-bold text-green-400 truncate">{alt}</h2>
            </div>
            <div className="w-full flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: showInfo ? 1 : 0, height: showInfo ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-1 overflow-hidden"
              >
                <p className="text-sm text-green-300 flex items-center">
                  <User size={14} className="mr-2" />
                  <span className="text-green-400 font-semibold">{username || 'Unknown'}</span>
                </p>
                <p className="text-xs text-green-300 flex items-center">
                  <Calendar size={14} className="mr-2" />
                  <span className="text-green-400">{new Date(createdAt).toLocaleString()}</span>
                </p>
              </motion.div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowInfo(!showInfo)
                  }}
                  className="bg-green-900 hover:bg-green-800 text-green-400 border-green-500"
                >
                  <Info size={20} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload()
                  }}
                  className="bg-green-900 hover:bg-green-800 text-green-400 border-green-500"
                >
                  <Download size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}