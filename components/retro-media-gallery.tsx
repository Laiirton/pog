    // Start of Selection
    'use client'
    
    import { useState, useRef, useEffect } from 'react'
    import { motion, AnimatePresence } from 'framer-motion'
    import { X } from 'lucide-react'
    import { VideoPlayer } from './video-player'
    
    const MatrixRain = () => {
      const canvasRef = useRef<HTMLCanvasElement | null>(null)
    
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
    
        const drops: number[] = [];
        for (let i = 0; i < columns; i++) {
          drops[i] = 1;
        }
    
        function draw() {
          if (!ctx || !canvas) return;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
    
          ctx.fillStyle = '#0F0';
          ctx.font = `${fontSize}px monospace`;
    
          for (let i = 0; i < drops.length; i++) {
            const text = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          }
        }
    
        const interval = setInterval(draw, 33);
    
        return () => clearInterval(interval);
      }, [])
    
      return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
    }
    
    interface MediaItem {
      id: string;
      title: string;
      type: 'video' | 'image';
      src: string;
      thumbnail: string;
    }
    
    export function RetroMediaGalleryComponent() {
      console.log('Componente RetroMediaGalleryComponent renderizado');
      const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
      const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

      useEffect(() => {
        const fetchMedia = async () => {
          try {
            console.log('Iniciando busca de mídia');
            const response = await fetch('http://localhost:3001/media');
            console.log('Resposta recebida:', response);
            const data = await response.json();
            console.log('Dados recebidos:', data);
            const updatedData = data.map((item: MediaItem) => ({
              ...item,
              src: `http://localhost:3001/file/${item.id}`,
              thumbnail: item.type === 'video'
                ? `http://localhost:3001/thumbnail/${item.id}`
                : `http://localhost:3001/file/${item.id}`
            }));
            setMediaItems(updatedData);
          } catch (error) {
            console.error('Erro ao buscar itens de mídia:', error);
          }
        };

        fetchMedia();
      }, []);

      console.log('mediaItems:', mediaItems);

      return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
          <MatrixRain />
          <div className="relative z-10 p-8">
            <h1 className="text-5xl mb-12 text-center font-bold glitch" data-text="Pog Gallery">
              Pog Gallery
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mediaItems.map((item: MediaItem) => (
                <motion.div
                  key={item.id}
                  className="bg-black border-2 border-green-500 rounded-lg overflow-hidden shadow-lg hover:shadow-green-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  whileHover={{ scale: 1.05, borderColor: '#00FF00' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMedia(item)}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <span className="text-green-500 text-lg font-bold glitch" data-text={item.type === 'video' ? 'Ver vídeo' : 'Ver imagem'}>
                        {item.type === 'video' ? 'Ver vídeo' : 'Ver imagem'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-2 glitch" data-text={item.title}>{item.title}</h2>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {selectedMedia && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
              >
                <div className="w-full max-w-4xl">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => setSelectedMedia(null)}
                      className="text-green-500 hover:text-green-300 transition-colors duration-200"
                      aria-label="Fechar"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="w-full aspect-video">
                    {selectedMedia.type === 'video' ? (
                      <VideoPlayer src={selectedMedia.src} />
                    ) : (
                      <img src={selectedMedia.src} alt={selectedMedia.title} className="w-full h-full object-contain" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }