    // Start of Selection
    'use client'
    
    import { useState, useEffect, useRef } from 'react'
    import { motion, AnimatePresence } from 'framer-motion'
    import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react'
    
    const mediaItems = [
      { id: 1, title: 'Hack the Planet', type: 'video', src: '/placeholder.svg?height=400&width=600' },
      { id: 2, title: 'Cyber Beats', type: 'audio', src: '/placeholder.svg?height=400&width=600' },
      { id: 3, title: 'Neural Network', type: 'video', src: '/placeholder.svg?height=400&width=600' },
      { id: 4, title: 'Quantum Echoes', type: 'audio', src: '/placeholder.svg?height=400&width=600' },
      { id: 5, title: 'Digital Frontier', type: 'video', src: '/placeholder.svg?height=400&width=600' },
      { id: 6, title: 'Synthetic Dreams', type: 'audio', src: '/placeholder.svg?height=400&width=600' },
    ]
    
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
    
    const CustomPlayer = ({ media, onClose }: { media: typeof mediaItems[number]; onClose: () => void }) => {
      const [isPlaying, setIsPlaying] = useState(false)
      const [isMuted, setIsMuted] = useState(false)
      const [volume, setVolume] = useState(1)
      const [progress, setProgress] = useState(0)
      const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)
    
      const togglePlay = () => {
        if (isPlaying) {
          mediaRef.current?.pause();
        } else {
          mediaRef.current?.play();
        }
        setIsPlaying(!isPlaying)
      }
    
      const toggleMute = () => {
        if (mediaRef.current) {
          mediaRef.current.muted = !isMuted;
          setIsMuted(!isMuted)
        }
      }
    
      const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (mediaRef.current) {
          mediaRef.current.volume = newVolume;
          setIsMuted(newVolume === 0)
        }
      }
    
      const handleTimeUpdate = () => {
        if (mediaRef.current) {
          const progress = (mediaRef.current.currentTime / mediaRef.current.duration) * 100;
          setProgress(progress)
        }
      }
    
      const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (mediaRef.current) {
          const seekTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * mediaRef.current.duration;
          mediaRef.current.currentTime = seekTime;
        }
      }
    
      return (
        <div className="bg-black border-2 border-green-500 p-6 rounded-lg max-w-4xl w-full shadow-lg shadow-green-500/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-500 glitch" data-text={media.title}>{media.title}</h2>
            <button
              onClick={onClose}
              className="text-green-500 hover:text-green-300 transition-colors duration-200"
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          </div>
          <div className="relative aspect-video bg-black overflow-hidden rounded-lg">
            {media.type === 'video' ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={media.src}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={media.src}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          {(media.type === 'video' || media.type === 'audio') && (
            <div className="mt-4 relative">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="text-green-500 hover:text-green-300 transition-colors duration-200"
                  aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <div className="flex-grow bg-green-900 h-2 rounded-full overflow-hidden cursor-pointer relative" onClick={handleSeek}>
                  <div className="bg-green-500 h-full transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }}></div>
                  <div 
                    className="absolute top-1/2 left-0 w-3 h-3 bg-green-300 rounded-full -translate-y-1/2 shadow-md" 
                    style={{ left: `min(${progress}%, 97%)` }}
                  ></div>
                </div>
                {/* Removendo o botão de volume e o controle deslizante */}
              </div>
            </div>
          )}
        </div>
      )
    }
    
    export function RetroMediaGalleryComponent() {
      const [selectedMedia, setSelectedMedia] = useState<typeof mediaItems[number] | null>(null)
    
      return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
          <MatrixRain />
          <div className="relative z-10 p-8">
            <h1 className="text-5xl mb-12 text-center font-bold glitch" data-text="Retro Media Gallery">
              Retro Media Gallery
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mediaItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="bg-black border-2 border-green-500 rounded-lg overflow-hidden shadow-lg hover:shadow-green-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  whileHover={{ scale: 1.05, borderColor: '#00FF00' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMedia(item)}
                >
                  <div className="relative">
                    <img src={item.src} alt={item.title} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <span className="text-green-500 text-lg font-bold glitch" data-text={`View ${item.type}`}>View {item.type}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-2 glitch" data-text={item.title}>{item.title}</h2>
                    <p className="text-green-300">{item.type}</p>
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
                <CustomPlayer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }