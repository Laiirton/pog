'use client'
    
import useSWR from 'swr'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Trash2, Upload, User } from 'lucide-react'
import { VideoPlayer } from './video-player'
import { ImageFrame } from './image-frame'
import { MediaUpload } from './media-upload'
import { MatrixRain } from './matrix-rain'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FilterComponentsComponent } from './filter-components'
import { Button } from "@/components/ui/button"
import { AdminLogin } from './admin-login'

const fetcher = async (url: string) => {
  const response = await fetch(`/api/${url}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
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
  const { data: mediaItems, error, mutate } = useSWR<MediaItem[]>('media', fetcher);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'all' | 'images' | 'videos'>('all')
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set())

  const observerRef = useRef<IntersectionObserver | null>(null)

  const [selectedType, setSelectedType] = useState('all')
  const [selectedUser, setSelectedUser] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const [allUsers, setAllUsers] = useState<string[]>([])

  useEffect(() => {
    if (mediaItems) {
      const users = Array.from(new Set(mediaItems.map((item: MediaItem) => item.username).filter(Boolean) as string[]));
      setAllUsers(users);
    }
  }, [mediaItems]);

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
      const response = await fetch('/api/admin-login', {
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
        const response = await fetch(`/api/delete-media/${id}`, {
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

  if (error) return <div>Error loading media: {error.message}</div>

  const filteredMediaItems = useMemo(() => {
    if (!mediaItems) return [];
    return mediaItems.filter(item => 
      (selectedType === 'all' || item.type === selectedType) &&
      (!selectedUser || item.username === selectedUser) &&
      (!searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!startDate || new Date(item.created_at) >= startDate) &&
      (!endDate || new Date(item.created_at) <= endDate)
    );
  }, [mediaItems, selectedType, selectedUser, searchTerm, startDate, endDate]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      <MatrixRain />
      <div className="relative z-10 flex flex-col h-screen">
        <header className="bg-black bg-opacity-80 p-4 flex justify-between items-center border-b border-green-500">
          <div className="w-1/3">
            {/* Espaço vazio à esquerda para balancear o layout */}
          </div>
          <motion.h1 
            className="text-4xl font-bold text-center relative w-1/3"
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
          <div className="flex space-x-4 w-1/3 justify-end">
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-green-600 hover:bg-green-700 text-black border border-green-300 shadow-lg shadow-green-500/50 transition-all duration-300"
            >
              <Upload size={20} className="mr-2" />
              Upload
            </Button>
            {!isAdmin && (
              <Button
                onClick={() => setShowAdminLogin(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black border border-yellow-300 shadow-lg shadow-yellow-500/50 transition-all duration-300"
              >
                <User size={20} className="mr-2" />
                Admin Login
              </Button>
            )}
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white border border-red-300 shadow-lg shadow-red-500/50 transition-all duration-300"
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-grow overflow-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-green-500">Filters</h2>
              <FilterComponentsComponent
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                allUsers={allUsers}
              />
            </div>
            
            <div className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
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
            </div>
          </div>
        </main>
      </div>

      <SelectedMediaModal selectedMedia={selectedMedia} onClose={() => setSelectedMedia(null)} />
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="bg-black border border-green-500 rounded-lg p-6 relative max-w-md w-full">
            <button
              onClick={() => setShowUpload(false)}
              className="absolute top-2 right-2 text-green-500 hover:text-green-300 transition-colors duration-200"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-green-500">Upload Media</h2>
            <MediaUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}
      {showAdminLogin && (
        <AdminLogin onLogin={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />
      )}
    </div>
  )
}

const MediaItem = ({ item, onClick, onDelete, observerRef, isLoaded }: { 
  item: MediaItem; 
  onClick: () => void; 
  onDelete?: () => void;
  observerRef: React.RefObject<IntersectionObserver>;
  isLoaded: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      className="bg-black border-2 border-green-500 rounded-lg overflow-hidden shadow-lg hover:shadow-green-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative"
      whileHover={{ scale: 1.05, borderColor: '#00FF00' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="relative aspect-video">
        {!imageError ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            layout="fill"
            objectFit="cover"
            className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <span className="text-green-500">Image not available</span>
          </div>
        )}
        {!imageLoaded && !imageError && (
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

const SelectedMediaModal = ({ selectedMedia, onClose }: { selectedMedia: MediaItem | null; onClose: () => void }) => {
  const getImageSrc = (src: string) => {
    if (src.includes('drive.google.com')) {
      const fileId = src.match(/\/d\/(.+?)\/view/)?.[1];
      return fileId ? `/api/file/${fileId}` : src;
    }
    return src;
  };

  return (
    <AnimatePresence>
      {selectedMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        >
          <div className="w-full max-w-4xl relative">
            <button
              onClick={onClose}
              className="absolute -top-10 right-0 text-green-500 hover:text-green-300 transition-colors duration-200 bg-black bg-opacity-50 rounded-full p-2"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <div className="w-full aspect-video">
              {selectedMedia.type === 'video' ? (
                <VideoPlayer src={getImageSrc(selectedMedia.src)} title={selectedMedia.title} />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={getImageSrc(selectedMedia.src)}
                    alt={selectedMedia.title || ''}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-green-500 p-2">
                    <p>Uploaded by: {selectedMedia.username || 'Unknown'}</p>
                    <p>Uploaded on: {formatDate(selectedMedia.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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
