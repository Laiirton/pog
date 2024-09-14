'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Terminal, Code, Cpu } from 'lucide-react'

export function OldschoolHackerGalleryComponent() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      const imageContext = import.meta.glob('../public/gallery/*.{png,jpg,jpeg,svg}');
      const loadedImages = await Promise.all(
        Object.values(imageContext).map((importImage: any) => importImage())
      );
      setImages(loadedImages.map((img) => img.default));
    };
    loadImages();
  }, []);
    };
    loadImages();
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedText, setTypedText] = useState('')

  // Cria o array de itens da galeria dinamicamente
  const galleryItems = images.map((image: string) => ({
    type: 'image',
    src: image,
    alt: image.split('/').pop()?.split('.')[0] || 'Gallery Image' // Extrai o nome do arquivo como alt
  }));

  const nextItem = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryItems.length)
  }

  const prevItem = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + galleryItems.length) % galleryItems.length)
  }

  useEffect(() => {
    const text = "INITIALIZING GALLERY..."
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

  return (
    <div className="min-h-screen bg-black text-green-500 p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {typedText}
        </motion.h1>
        <div className="relative mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="aspect-video rounded-lg overflow-hidden border-4 border-green-500 shadow-lg shadow-green-500/50"
            >
              {galleryItems[currentIndex].type === 'image' ? (
                <img
                  src={galleryItems[currentIndex].src}
                  alt={galleryItems[currentIndex].alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={galleryItems[currentIndex].src}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                />
              )}
              <div className="absolute inset-0 bg-green-900/30 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
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
                <div className="w-full h-full bg-green-900 flex items-center justify-center">
                  <Terminal size={48} className="text-green-400" />
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
  )
}