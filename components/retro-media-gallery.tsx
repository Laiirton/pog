/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
    
// Importações necessárias para o componente
import useSWR from 'swr'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Trash2, Upload, User, ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { VideoPlayer } from './video-player'
import { ImageFrame } from './image-frame'
import { MediaUpload } from './media-upload'
import { MatrixRain } from './matrix-rain'
import Image from 'next/image'
import { FilterComponentsComponent } from './filter-components'
import { Button } from "@/components/ui/button"
import { AdminLogin } from './admin-login'
import { LoadingAnimation } from './loading-animation'
import { useImagePreloader } from '../hooks/useImagePreloader'

// Função para buscar dados da API
const fetcher = async (url: string): Promise<MediaItem[]> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  return data.map((item: MediaItem) => ({
    ...item,
    upvotes: item.upvotes || 0,
    downvotes: item.downvotes || 0,
    user_vote: item.user_vote || 0
  }))
}

// Interface para definir a estrutura de um item de mídia
interface MediaItem {
  id: string
  title: string
  type: 'video' | 'image'
  src: string
  thumbnail: string
  username: string
  created_at: string
  upvotes: number
  downvotes: number
  user_vote?: number
}

// Interface para definir a estrutura dos votos do usuário
interface UserVotes {
  [mediaId: string]: number
}

// Função para formatar a data
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Interface para as props do componente RetroMediaGalleryComponent
interface RetroMediaGalleryComponentProps {
  onLogout: () => void
}

// Função para obter a URL da imagem, tratando links do Google Drive
const getImageSrc = (src: string) => {
  if (src.includes('drive.google.com')) {
    const fileId = src.match(/\/d\/(.+?)\/view/)?.[1] || src.match(/id=(.+?)(&|$)/)?.[1]
    return fileId ? `/api/file/${fileId}` : src
  }
  return src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_BASE_URL}${src}`
}

const BATCH_SIZE = 10;

// Componente principal da galeria de mídia retrô
export function RetroMediaGalleryComponent({ onLogout }: RetroMediaGalleryComponentProps) {
  // Estados e hooks para gerenciar os dados e o estado da aplicação
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedUser, setSelectedUser] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [allUsers, setAllUsers] = useState<string[]>([])
  const [title, setTitle] = useState('') // Estado para o título
  const [date, setDate] = useState<Date | null>(null) // Estado para a data
  const [username, setUsername] = useState<string | null>(null)
  const [userScore, setUserScore] = useState(0)
  const [userVotes, setUserVotes] = useState<UserVotes>({})
  const [sortBy, setSortBy] = useState('')

  const { preloadImage, getCachedImage, preloadImages, imageCache } = useImagePreloader()

  // Função para buscar dados da API com o token do usuário
  const fetcherWithToken = useCallback((url: string) => {
    const userToken = localStorage.getItem('username')
    const urlWithToken = `${url}${url.includes('?') ? '&' : '?'}userToken=${userToken}`
    return fetch(urlWithToken)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        return data.map((item: MediaItem) => ({
          ...item,
          upvotes: item.upvotes || 0,
          downvotes: item.downvotes || 0,
          user_vote: item.user_vote || 0
        }))
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error)
        throw error
      })
  }, [])

  const { data: mediaItems, error, mutate } = useSWR<MediaItem[]>('/api/media', fetcherWithToken, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000 // Recarrega a cada 1 minuto
  })

  // Efeito para carregar a lista de usuários
  useEffect(() => {
    if (mediaItems) {
      const users = Array.from(new Set(mediaItems.map((item: MediaItem) => item.username).filter(Boolean) as string[]))
      setAllUsers(users)
    }
  }, [mediaItems])

  // Efeito para carregar o nome de usuário do localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username')
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  // Função para buscar os votos do usuário
  const fetchUserVotes = useCallback(async () => {
    const userToken = localStorage.getItem('username')
    if (userToken) {
      try {
        const response = await fetch(`/api/user-votes?username=${userToken}`)
        if (response.ok) {
          const data = await response.json()
          const votes = data.user.votes.reduce((acc: UserVotes, vote: { file_id: string, voteType: number }) => {
            acc[vote.file_id] = vote.voteType
            return acc
          }, {})
          setUserVotes(votes)
        } else {
          console.error('Failed to fetch user votes')
        }
      } catch (error) {
        console.error('Error fetching user votes:', error)
      }
    }
  }, [])

  // Efeito para carregar os votos do usuário ao abrir a página
  useEffect(() => {
    fetchUserVotes()
  }, [fetchUserVotes])

  // Função para lidar com o logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('username')
    localStorage.removeItem('adminToken') // Remover o token de admin
    setIsAdmin(false) // Resetar o estado de admin
    setAdminToken('') // Limpar o token de admin no estado
    onLogout()
  }, [onLogout])

  // Efeito para verificar se há um token de admin armazenado
  useEffect(() => {
    const checkAdminStatus = async () => {
      const storedToken = localStorage.getItem('adminToken')
      if (storedToken) {
        try {
          // Verificar se o token ainda é válido
          const response = await fetch('/api/verify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken }),
          })
          if (response.ok) {
            setIsAdmin(true)
            setAdminToken(storedToken)
          } else {
            // Se o token não for válido, limpar
            localStorage.removeItem('adminToken')
            setIsAdmin(false)
            setAdminToken('')
          }
        } catch (error) {
          console.error('Error verifying admin token:', error)
          localStorage.removeItem('adminToken')
          setIsAdmin(false)
          setAdminToken('')
        }
      }
    }

    checkAdminStatus()
  }, [])

  // Função para lidar com o login do admin
  const handleAdminLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (response.ok) {
        const { token } = await response.json()
        setIsAdmin(true)
        setAdminToken(token)
        localStorage.setItem('adminToken', token)
        setShowAdminLogin(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error during admin login:', error)
      setIsAdmin(false)
      setAdminToken('')
    }
  }

  // Efeito para pré-carregar imagens em lotes
  useEffect(() => {
    if (mediaItems) {
      const imagesToPreload = mediaItems.map(item => 
        item.type === 'image' ? getImageSrc(item.src) : `/api/proxy-image?url=${encodeURIComponent(item.thumbnail)}`
      );

      const preloadBatch = async (startIndex: number) => {
        const batch = imagesToPreload.slice(startIndex, startIndex + BATCH_SIZE);
        await preloadImages(batch);
        
        if (startIndex + BATCH_SIZE < imagesToPreload.length) {
          setTimeout(() => preloadBatch(startIndex + BATCH_SIZE), 100);
        }
      };

      preloadBatch(0);
    }
  }, [mediaItems, preloadImages]);

  // Filtragem e ordenação dos itens de mídia
  const filteredAndSortedMediaItems = useMemo(() => {
    if (!mediaItems) return []
    
    const filtered = mediaItems.filter(item => 
      (selectedType === 'all' || item.type === selectedType) &&
      (!selectedUser || item.username === selectedUser) &&
      (!searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!startDate || new Date(item.created_at) >= startDate)
    )

    if (sortBy === 'upvotes') {
      filtered.sort((a, b) => b.upvotes - a.upvotes)
    } else if (sortBy === 'downvotes') {
      filtered.sort((a, b) => b.downvotes - a.downvotes)
    }

    return filtered
  }, [mediaItems, selectedType, selectedUser, searchTerm, startDate, sortBy])

  // Função para lidar com o sucesso do upload
  const handleUploadSuccess = useCallback(() => {
    mutate()
    setShowUpload(false)
  }, [mutate])

  // Função para lidar com a exclusão de mídia
  const handleDeleteMedia = async (fileId: string) => {
    if (!isAdmin) return;
    if (confirm('Tem certeza de que deseja excluir esta mídia?')) {
      try {
        const response = await fetch(`/api/delete-media/${fileId}`, {
          method: 'DELETE',
          headers: { 'admin-token': adminToken },
        });
        const result = await response.json();
        if (response.ok) {
          console.log('Resultado da exclusão:', result);
          await forceRefresh(); // Força uma atualização imediata
        } else {
          console.error('Falha ao excluir mídia:', result);
        }
      } catch (error) {
        console.error('Erro ao excluir mídia:', error);
      }
    }
  }

  const forceRefresh = useCallback(async () => {
    try {
      const freshData = await fetcher('/api/media');
      mutate(freshData, false);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [mutate]);

  useEffect(() => {
    forceRefresh();
    const intervalId = setInterval(forceRefresh, 300000); // Força atualização a cada 5 minutos
    return () => clearInterval(intervalId);
  }, [forceRefresh]);

  // Função para lidar com os votos
  const handleVote = async (mediaId: string, voteType: number) => {
    if (!username) {
      alert('Você precisa estar logado para votar.')
      return
    }

    try {
      const userToken = localStorage.getItem('username') // Pegando o token do localStorage
      if (!userToken) {
        alert('Token de usuário não encontrado. Faça login novamente.')
        return
      }

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: mediaId.toString(), userToken, voteType }),
      })

      if (response.ok) {
        const result = await response.json()
        // Atualizar os dados localmente
        mutate(
          mediaItems?.map(item =>
            item.id === mediaId
              ? {
                  ...item,
                  upvotes: result.upvotes,
                  downvotes: result.downvotes,
                  user_vote: result.userVote,
                }
              : item
          )
        )
        // Atualizar os votos do usuário no estado
        setUserVotes(prevVotes => ({
          ...prevVotes,
          [mediaId]: result.userVote
        }))
      } else {
        throw new Error('Falha ao registrar o voto')
      }
    } catch (error) {
      console.error('Erro ao votar:', error)
      alert('Ocorreu um erro ao registrar seu voto. Por favor, tente novamente.')
    }
  }

  // Tratamento de erro na busca de mídia
  if (error) {
    console.error('Error fetching media:', error)
    return <div>Error loading media. Please try again later.</div>
  }

  // Exibição de loading enquanto os dados são carregados
  if (!mediaItems) {
    return <LoadingAnimation />
  }

  // Renderização do componente principal
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      <MatrixRain />
      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
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
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </div>
            
            <div className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {filteredAndSortedMediaItems.map((item: MediaItem) => (
                  <MediaItem 
                    key={item.id} 
                    item={item} 
                    onClick={() => setSelectedMedia(item)} 
                    onDelete={isAdmin ? () => handleDeleteMedia(item.id) : undefined}
                    preloadImage={preloadImage}
                    getCachedImage={getCachedImage}
                    onVote={handleVote}
                    username={username}
                    userVote={userVotes[item.id]}
                    imageCache={imageCache}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <SelectedMediaModal selectedMedia={selectedMedia} onClose={() => setSelectedMedia(null)} getCachedImage={getCachedImage} />
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
      <div className="text-green-500">
        Score do usuário: {userScore}
      </div>
    </div>
  )
}

// Componente para exibir um item de mídia individual
const MediaItem = ({ item, onClick, onDelete, preloadImage, getCachedImage, onVote, username, userVote, imageCache }: { 
  item: MediaItem; 
  onClick: () => void; 
  onDelete?: () => void
  preloadImage: (src: string) => Promise<void>
  getCachedImage: (src: string) => string | null
  onVote: (mediaId: string, voteType: number) => void
  username: string | null
  userVote?: number
  imageCache: Record<string, string>
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageSrc = item.type === 'image' 
    ? getImageSrc(item.src) 
    : `/api/proxy-image?url=${encodeURIComponent(item.thumbnail)}`;

  useEffect(() => {
    if (imageCache[imageSrc]) {
      setImageLoaded(true);
    } else {
      preloadImage(imageSrc)
        .then(() => setImageLoaded(true))
        .catch(() => setImageError(true));
    }
  }, [imageSrc, preloadImage, imageCache]);

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
            src={imageSrc}
            alt={item.title}
            layout="fill"
            objectFit="cover"
            className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            unoptimized
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
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2 glitch" data-text={item.title}>{item.title}</h2>
        <p className="text-sm text-green-400 mb-1">
          Uploaded by: <span className="font-bold">{item.username || 'Unknown'}</span>
        </p>
        <p className="text-xs text-green-300">
          Uploaded on: {formatDate(item.created_at)}
        </p>
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onVote(item.id, userVote === 1 ? 0 : 1)
            }}
            className={`flex items-center p-1 rounded ${userVote === 1 ? 'text-orange-500' : 'text-green-500'} hover:bg-green-900 transition-colors duration-300`}
            disabled={!username}
          >
            <ArrowBigUp size={20} />
            <span className="ml-1">{item.upvotes}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onVote(item.id, userVote === -1 ? 0 : -1)
            }}
            className={`flex items-center p-1 rounded ${userVote === -1 ? 'text-blue-500' : 'text-green-500'} hover:bg-green-900 transition-colors duration-300`}
            disabled={!username}
          >
            <span className="mr-1">{item.downvotes}</span>
            <ArrowBigDown size={20} />
          </button>
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
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

// Componente para exibir o modal com a mídia selecionada
const SelectedMediaModal = ({ selectedMedia, onClose, getCachedImage }: { selectedMedia: MediaItem | null; onClose: () => void; getCachedImage: (src: string) => string | null }) => {
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
            <div className="w-full aspect-video">
              {selectedMedia.type === 'video' ? (
                <VideoPlayer 
                  src={getImageSrc(selectedMedia.src)} 
                  title={selectedMedia.title} 
                  onClose={onClose}
                />
              ) : (
                <ImageFrame
                  src={getImageSrc(selectedMedia.src)}
                  alt={selectedMedia.title || ''}
                  username={selectedMedia.username || 'Unknown'}
                  createdAt={selectedMedia.created_at}
                  thumbnail={selectedMedia.thumbnail}
                  preloaded={true}
                  getCachedImage={getCachedImage}
                  onClose={onClose}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
