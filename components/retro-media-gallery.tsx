'use client'
    
import useSWR from 'swr'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut } from 'lucide-react'
import { VideoPlayer } from './video-player'
import { ImageFrame } from './image-frame'
import { MediaUpload } from './media-upload'
import { supabase } from '../lib/supabase'
import { MatrixRain } from './matrix-rain'
import { useRouter } from 'next/navigation'

const MEDIA_API_URL = process.env.NEXT_PUBLIC_MEDIA_API_URL || 'http://localhost:3001'

// Move fetcher function outside of the component
const fetcher = async () => {
  const [supabaseData, driveData] = await Promise.all([
    fetchSupabaseData(),
    fetchDriveData()
  ])
  const supabaseMap = new Map(supabaseData.map(item => [item.title, item]))
  const uniqueDriveData = driveData.filter((item: { title: string }) => !supabaseMap.has(item.title))

  return [...supabaseData, ...uniqueDriveData].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

const fetchSupabaseData = async () => {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

const fetchDriveData = async () => {
  const response = await fetch(`${MEDIA_API_URL}/media`)
  if (!response.ok) {
    throw new Error('Failed to fetch data from Google Drive API')
  }
  return response.json()
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

// Move formatDate function outside of the component
const formatDate = (dateString: string) => {
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
    refreshInterval: 60000,
  })

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'todos' | 'imagens' | 'videos'>('todos')
  const router = useRouter()

  const handleUploadSuccess = useCallback(() => {
    mutate()
    setShowUpload(false)
  }, [mutate])

  const handleLogout = () => {
    localStorage.removeItem('username')
    router.push('/')
  }

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro ao carregar mídias.</div>

  const mediaItems = data || []

  const filteredMediaItems = mediaItems.filter(item => {
    if (activeCategory === 'todos') return true
    if (activeCategory === 'imagens') return item.type === 'image'
    if (activeCategory === 'videos') return item.type === 'video'
    return true
  })

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      <MatrixRain />
      <div className="relative z-10 p-8">
        {/* Texto do criador atualizado com animação de troca */}
        <motion.div 
          className="absolute top-4 right-4 text-green-500 text-lg font-bold p-2 border-2 border-green-500 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: -20, rotateX: 90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 8px #00FF00" }}
        >
          <motion.div
            className="relative"
            initial={{ height: "auto" }}
            whileHover={{ height: 0 }}
            transition={{ duration: 0.3 }}
          >
            Criado por Anjinho Ruindade Pura 😈
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Criado por Lairton
          </motion.div>
        </motion.div>
        
        {/* Updated title with animation */}
        <motion.h1 
          className="text-6xl font-bold mb-8 text-center relative"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        >
          <motion.span
            className="inline-block"
            animate={{ 
              color: ["#00FF00", "#FFFFFF", "#00FF00"],
              textShadow: [
                "0 0 5px #00FF00, 0 0 10px #00FF00",
                "0 0 5px #FFFFFF, 0 0 10px #FFFFFF",
                "0 0 5px #00FF00, 0 0 10px #00FF00"
              ]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2, 
              ease: "easeInOut" 
            }}
          >
            Pog Gallery
          </motion.span>
        </motion.h1>

        <div className="flex justify-between items-center mb-8">
          <CategoryButtons activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          <div className="flex space-x-4">
            <button
              onClick={() => setShowUpload(true)}
              className="bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300"
            >
              Upload
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMediaItems.map((item: MediaItem) => (
            <MediaItem key={item.id} item={item} onClick={() => setSelectedMedia(item)} />
          ))}
        </div>
      </div>
      <SelectedMediaModal selectedMedia={selectedMedia} onClose={() => setSelectedMedia(null)} />
      <UploadModal showUpload={showUpload} onUploadSuccess={handleUploadSuccess} onClose={() => setShowUpload(false)} />
    </div>
  )
}

// Separate components for better organization
const MediaItem = ({ item, onClick }: { item: MediaItem; onClick: () => void }) => (
  <motion.div
    className="bg-black border-2 border-green-500 rounded-lg overflow-hidden shadow-lg hover:shadow-green-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    whileHover={{ scale: 1.05, borderColor: '#00FF00' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
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
)

const SelectedMediaModal = ({ selectedMedia, onClose }: { selectedMedia: MediaItem | null; onClose: () => void }) => (
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
              onClick={onClose}
              className="text-green-500 hover:text-green-300 transition-colors duration-200"
              aria-label="Fechar"
            >
              <X size={24} />
            </button>
          </div>
          <div className="w-full aspect-video">
            {selectedMedia.type === 'video' ? (
              <VideoPlayer src={selectedMedia.src} title={selectedMedia.title} />
            ) : (
              <ImageFrame
                src={selectedMedia.src}
                alt={selectedMedia.title || ''}
                username={selectedMedia.username || ''}
                createdAt={selectedMedia.created_at || ''}
              />
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

const UploadModal = ({ showUpload, onUploadSuccess, onClose }: { showUpload: boolean; onUploadSuccess: () => void; onClose: () => void }) => (
  showUpload && (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <MediaUpload onUploadSuccess={onUploadSuccess} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-green-500 hover:text-green-300 transition-colors duration-200"
        aria-label="Fechar"
      >
        <X size={24} />
      </button>
    </div>
  )
)

const CategoryButtons = ({ activeCategory, setActiveCategory }: { 
  activeCategory: 'todos' | 'imagens' | 'videos', 
  setActiveCategory: (category: 'todos' | 'imagens' | 'videos') => void 
}) => (
  <div className="flex space-x-4">
    {['todos', 'imagens', 'videos'].map((category) => (
      <button
        key={category}
        onClick={() => setActiveCategory(category as 'todos' | 'imagens' | 'videos')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
          activeCategory === category
            ? 'bg-green-500 text-black shadow-lg shadow-green-500/50'
            : 'bg-black text-green-500 border border-green-500 hover:bg-green-500 hover:text-black'
        }`}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </button>
    ))}
  </div>
)
