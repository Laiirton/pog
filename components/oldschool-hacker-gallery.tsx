'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Terminal, Code, Cpu, Volume2, VolumeX } from 'lucide-react'
import MatrixBackground from './MatrixBackground'

interface GalleryItem {
  type: 'image' | 'video';
  src: string;
  alt: string;
  thumbnail?: string; // Nova propriedade para a miniatura do vídeo
}

export function OldschoolHackerGalleryComponent() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isButtonVisible, setIsButtonVisible] = useState(true)

  useEffect(() => {
    const loadGalleryItems = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/gallery');
        const items = await response.json();
        console.log('Received gallery items:', items);
        setGalleryItems(items);
      } catch (error) {
        console.error('Erro ao carregar itens da galeria:', error);
      } finally {
        setIsLoading(false)
      }
    }
    loadGalleryItems();
  }, [])

  useEffect(() => {
    if (galleryItems[currentIndex]?.type === 'video' && videoRef.current) {
      videoRef.current.play()
      setIsVideoPlaying(true)
    }
  }, [currentIndex, galleryItems])

  const nextItem = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryItems.length)
  }

  const prevItem = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + galleryItems.length) % galleryItems.length)
  }

  useEffect(() => {
    const text = "POGGERS"
    let i = 0
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setTypedText(prev => prev + text.charAt(i))
        i++
      } else {
        clearInterval(typingInterval)
      }
    }, 100)
    return () => clearInterval(typingInterval)
  }, [])

  const toggleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
        setIsVideoPlaying(false)
      } else {
        videoRef.current.play()
        setIsVideoPlaying(true)
      }
    }
    // Esconde o botão após 1 segundo
    setTimeout(() => setIsButtonVisible(false), 1000)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const handleVideoClick = () => {
    setIsButtonVisible(true)
  }

  return (
    <>
      <MatrixBackground />
      <div className="min-h-screen bg-black bg-opacity-50 text-green-500 p-8 font-mono relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {typedText}
          </motion.h1>
          {isLoading ? (
            <div className="text-center">Carregando galeria...</div>
          ) : galleryItems.length > 0 ? (
            <div className="relative mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                  className="aspect-video rounded-lg overflow-hidden border-4 border-green-500 shadow-lg shadow-green-500/50 relative"
                >
                  {galleryItems[currentIndex].type === 'image' ? (
                    <img
                      src={galleryItems[currentIndex].src}
                      alt={galleryItems[currentIndex].alt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        src={galleryItems[currentIndex].src}
                        className="w-full h-full object-cover cursor-pointer"
                        loop
                        controls={false}
                        onClick={handleVideoClick}
                      />
                      {/* Botão de play/pause centralizado */}
                      <AnimatePresence>
                        {isButtonVisible && (
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <button
                              onClick={toggleVideoPlayPause}
                              className="bg-green-900 bg-opacity-40 hover:bg-opacity-60 text-green-300 hover:text-green-100 transition-all duration-300 w-16 h-16 flex items-center justify-center rounded-full border-2 border-green-500 shadow-lg shadow-green-500/50 group overflow-hidden"
                            >
                              <span className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                              {isVideoPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                  <rect x="6" y="4" width="4" height="16" />
                                  <rect x="14" y="4" width="4" height="16" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Controles de volume no canto inferior direito */}
                      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-green-900 bg-opacity-75 p-2 rounded-lg">
                        <button
                          onClick={toggleMute}
                          className="text-green-300 hover:text-green-100 transition-colors"
                        >
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 accent-green-500"
                        />
                      </div>
                    </>
                  )}
                  <div className="absolute inset-0 bg-green-900/30 mix-blend-overlay pointer-events-none"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                </motion.div>
              </AnimatePresence>
              <button
                onClick={prevItem}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-900 text-green-300 p-2 rounded-full hover:bg-green-700 transition-all z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextItem}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-900 text-green-300 p-2 rounded-full hover:bg-green-700 transition-all z-10"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          ) : (
            <div className="text-center">Nenhum item na galeria.</div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryItems.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(0, 255, 0, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="aspect-video rounded-lg overflow-hidden border-2 border-green-700 cursor-pointer relative group"
                onClick={() => setCurrentIndex(index)}
              >
                {item.type === 'image' ? (
                  <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-green-900 flex items-center justify-center relative">
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.alt} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-green-400">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Code size={24} className="text-green-400 mr-2" />
                  <span className="text-green-400 text-sm">SELECT</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <footer className="mt-12 text-center text-green-600">
          <p className="flex items-center justify-center">
            <Cpu size={16} className="mr-2" /> System Status: ONLINE
          </p>
        </footer>
      </div>
    </>
  )
}