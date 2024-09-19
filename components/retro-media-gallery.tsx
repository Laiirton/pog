'use client'
    
import useSWR from 'swr'
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Trash2, Upload } from 'lucide-react'
import { VideoPlayer } from './video-player'
import { ImageFrame } from './image-frame'
import { MediaUpload } from './media-upload'
import { supabase } from '../lib/supabase'
import { MatrixRain } from './matrix-rain'
import { useRouter } from 'next/navigation'
import { AdminLogin } from './admin-login'
import Image from 'next/image'

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
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

interface RetroMediaGalleryComponentProps {
  onLogout: () => void;
}

export function RetroMediaGalleryComponent({ onLogout }: RetroMediaGalleryComponentProps) {
  const { data, error, isLoading, mutate } = useSWR<MediaItem[]>('media', fetcher, {
    refreshInterval: 60000,
  })

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'all' | 'images' | 'videos'>('all')
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set())

  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleUploadSuccess = useCallback(() => {
    mutate()
    setShowUpload(false)
  }, [mutate])

  const handleLogout = () => {
    localStorage.removeItem('username')
    localStorage.removeItem('adminToken')
    setIsAdmin(false)
    setAdminToken('')
    onLogout()
  }

  const handleAdminLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDIA_API_URL}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const { token } = await response.json();
        setIsAdmin(true);
        setAdminToken(token);
        localStorage.setItem('adminToken', token);
        setShowAdminLogin(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error during admin login:', error);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!isAdmin) return
    if (confirm('Are you sure you want to delete this media?')) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDIA_API_URL}/delete-media/${id}`, {
          method: 'DELETE',
          headers: { 'admin-token': adminToken },
        })
        const result = await response.json()
        if (response.ok) {
          console.log('Delete result:', result)
          mutate() // Refresh the media list
        } else {
          console.error('Failed to delete media:', result)
        }
      } catch (error) {
        console.error('Error deleting media:', error)
      }
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken')
    if (storedToken) {
      setIsAdmin(true)
      setAdminToken(storedToken)
    }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            setLoadedThumbnails((prev) => new Set(prev).add(img.dataset.src || ''))
            observerRef.current?.unobserve(img)
          }
        })
      },
      { rootMargin: '100px' }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  if (isLoading) return <LoadingAnimation />;
  if (error) return <div>Error loading media.</div>

  const mediaItems = data || []

  const filteredMediaItems = mediaItems.filter(item => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'images') return item.type === 'image'
    if (activeCategory === 'videos') return item.type === 'video'
    return true
  })

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      <MatrixRain />
      <div className="relative z-10 p-8">
        <Header onLogout={onLogout} setShowUpload={setShowUpload} setShowAdminLogin={setShowAdminLogin} isAdmin={isAdmin} />
        
        <CategoryButtons activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        
        <div className="mt-8">
          <MediaGrid 
            filteredMediaItems={filteredMediaItems} 
            setSelectedMedia={setSelectedMedia} 
            handleDeleteMedia={handleDeleteMedia}
            isAdmin={isAdmin}
            observerRef={observerRef}
            loadedThumbnails={loadedThumbnails}
          />
        </div>
      </div>
      <SelectedMediaModal selectedMedia={selectedMedia} onClose={() => setSelectedMedia(null)} />
      <UploadModal showUpload={showUpload} onUploadSuccess={handleUploadSuccess} onClose={() => setShowUpload(false)} />
      {showAdminLogin && (
        <AdminLogin onLogin={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />
      )}
    </div>
  )
}

function Header({ 
  onLogout,
  setShowUpload,
  setShowAdminLogin,
  isAdmin
}: {
  onLogout: () => void;
  setShowUpload: (show: boolean) => void;
  setShowAdminLogin: (show: boolean) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="mb-8">
      <motion.h1 
        className="text-6xl font-bold mb-4 text-center relative"
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
            duration: 5, 
            ease: "easeInOut" 
          }}
        >
          Pog Gallery
        </motion.span>
      </motion.h1>
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setShowUpload(true)}
          className="bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"
        >
          <Upload size={20} className="mr-2" />
          Upload
        </button>
        {!isAdmin && (
          <button
            onClick={() => setShowAdminLogin(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            Admin Login
          </button>
        )}
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  )
}

function MediaGrid({ 
  filteredMediaItems, 
  setSelectedMedia, 
  handleDeleteMedia, 
  isAdmin, 
  observerRef, 
  loadedThumbnails 
}: {
  filteredMediaItems: MediaItem[];
  setSelectedMedia: (item: MediaItem) => void;
  handleDeleteMedia: (id: string) => void;
  isAdmin: boolean;
  observerRef: React.RefObject<IntersectionObserver>;
  loadedThumbnails: Set<string>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredMediaItems.map((item: MediaItem) => (
        <MediaItem 
          key={item.id} 
          item={item} 
          onClick={() => setSelectedMedia(item)} 
          onDelete={isAdmin ? () => handleDeleteMedia(item.id) : undefined}
          observerRef={observerRef}
          isLoaded={loadedThumbnails.has(item.thumbnail)}
        />
      ))}
    </div>
  )
}

// Update MediaItem component to use lazy loading and caching
const MediaItem = ({ item, onClick, onDelete, observerRef, isLoaded }: { 
  item: MediaItem; 
  onClick: () => void; 
  onDelete?: () => void;
  observerRef: React.RefObject<IntersectionObserver>;
  isLoaded: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      className="bg-black border-2 border-green-500 rounded-lg overflow-hidden shadow-lg hover:shadow-green-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative"
      whileHover={{ scale: 1.05, borderColor: '#00FF00' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <Image
          src={item.thumbnail}
          alt={item.title}
          layout="fill"
          objectFit="cover"
          className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          placeholder="blur"
          blurDataURL="/placeholder.jpg"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <span className="text-green-500">Loading...</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="text-green-500 text-lg font-bold glitch" data-text={item.type === 'video' ? 'View video' : 'View image'}>
            {item.type === 'video' ? 'View video' : 'View image'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2 glitch" data-text={item.title}>{item.title}</h2>
        {item.username && <p className="text-sm text-green-400">Uploaded by: {item.username}</p>}
        <p className="text-xs text-green-300 mt-1">Uploaded on: {formatDate(item.created_at)}</p>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors duration-300"
          aria-label="Delete media"
        >
          <Trash2 size={16} />
        </button>
      )}
    </motion.div>
  )
}

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
              aria-label="Close"
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
                username={selectedMedia.username || 'Unknown'}
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
        aria-label="Close"
      >
        <X size={24} />
      </button>
    </div>
  )
)

const CategoryButtons = ({ activeCategory, setActiveCategory }: { 
  activeCategory: 'all' | 'images' | 'videos', 
  setActiveCategory: (category: 'all' | 'images' | 'videos') => void 
}) => (
  <div className="flex space-x-4">
    {[
      { key: 'all', label: 'All' },
      { key: 'images', label: 'Images' },
      { key: 'videos', label: 'Videos' }
    ].map(({ key, label }) => (
      <button
        key={key}
        onClick={() => setActiveCategory(key as 'all' | 'images' | 'videos')}
        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
          activeCategory === key
            ? 'bg-green-500 text-black shadow-lg shadow-green-500/50'
            : 'bg-black text-green-500 border border-green-500 hover:bg-green-500 hover:text-black'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
)

export const LoadingAnimation = () => {
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const circleVariants = {
    start: {
      y: '0%',
      opacity: 0,
    },
    end: {
      y: '100%',
      opacity: 1,
    },
  };

  const circleTransition = {
    duration: 0.8,
    yoyo: Infinity,
    ease: 'easeInOut',
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <motion.div
        className="flex space-x-4 mb-8"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.span
            key={index}
            className="w-4 h-4 bg-green-500 rounded-full"
            variants={circleVariants}
            transition={circleTransition}
            style={{
              filter: `blur(${index * 0.5}px)`,
              opacity: 1 - index * 0.2,
            }}
          />
        ))}
      </motion.div>
      <motion.h2
        className="text-green-500 text-3xl font-bold"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.5 }}
      >
        Pog Gallery
      </motion.h2>
    </div>
  );
};
