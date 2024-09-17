    'use client'
    
    import useSWR from 'swr'
    import { useState, useCallback, useRef, useEffect } from 'react'
    import { motion, AnimatePresence } from 'framer-motion'
    import { X } from 'lucide-react'
    import { VideoPlayer } from './video-player'
    import { MediaUpload } from './media-upload'
    import { supabase } from '../lib/supabase'

    const MEDIA_API_URL = process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:3001'

    const fetcher = async () => {
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      // Buscar dados da API do Google Drive
      const response = await fetch(`${MEDIA_API_URL}/media`)
      if (!response.ok) {
        throw new Error('Falha ao buscar dados da API do Google Drive')
      }
      const driveData = await response.json()

      // Criar um mapa de itens do Supabase usando o título como chave
      const supabaseMap = new Map(supabaseData.map(item => [item.title, item]))
      // Filtrar os itens do Drive que não estão no Supabase (baseado no título)
      const uniqueDriveData = driveData.filter((item: { title: string }) => !supabaseMap.has(item.title))

      // Combinar dados do Supabase e do Google Drive
      const combinedData = [...supabaseData, ...uniqueDriveData]

      return combinedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

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

        const drops: number[] = Array(Math.floor(columns)).fill(1);

        const draw = () => {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = '#0F0';
          ctx.font = `${fontSize}px monospace`;

          drops.forEach((drop, i) => {
            const text = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(text, i * fontSize, drop * fontSize);

            if (drop * fontSize > canvas.height && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
          });
        }

        const interval = setInterval(draw, 33);

        const handleResize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
          clearInterval(interval);
          window.removeEventListener('resize', handleResize);
        };
      }, [])

      return <canvas ref={canvasRef} className="fixed inset-0 z-0" />
    }

    interface MediaItem {
      id: string;
      title: string;
      type: 'video' | 'image';
      src: string;
      thumbnail: string;
      username?: string;
      created_at: string;
    }

    function formatDate(dateString: string) {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    export function RetroMediaGalleryComponent() {
      const { data, error, isLoading, mutate } = useSWR<MediaItem[]>('media', fetcher, {
        refreshInterval: 60000, // Atualiza a cada 60 segundos
      })

      const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
      const [showUpload, setShowUpload] = useState(false)

      const handleUploadSuccess = useCallback(() => {
        mutate()
        setShowUpload(false)
      }, [mutate])

      if (isLoading) return <div>Carregando...</div>
      if (error) return <div>Erro ao carregar mídias.</div>

      const mediaItems = data || []

      return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
          <MatrixRain />
          <div className="relative z-10 p-8">
            <h1 className="text-5xl mb-12 text-center font-bold glitch" data-text="Pog Gallery">
              Pog Gallery
            </h1>
            <button
              onClick={() => setShowUpload(true)}
              className="absolute top-4 right-4 bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300"
            >
              Upload
            </button>
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
                    {item.username && <p className="text-sm text-green-400">Enviado por: {item.username}</p>}
                    <p className="text-xs text-green-300 mt-1">Enviado em: {formatDate(item.created_at)}</p>
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
          {showUpload && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
              <MediaUpload onUploadSuccess={handleUploadSuccess} />
              <button
                onClick={() => setShowUpload(false)}
                className="absolute top-4 right-4 text-green-500 hover:text-green-300 transition-colors duration-200"
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
            </div>
          )}
        </div>
      )
    }