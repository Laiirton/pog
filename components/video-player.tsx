/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

import { Play, Pause, Volume2, VolumeX, Maximize, Rewind, FastForward, Download, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

// Interface que define as propriedades do componente VideoPlayer
interface VideoPlayerProps {
  src: string
  title: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  showDownloadButton?: boolean
  showFullscreenButton?: boolean
  showSkipButtons?: boolean
  onClose?: () => void // Nova prop para lidar com o fechamento
}

export function VideoPlayer({
  src,
  title,
  primaryColor = '#10B981',
  secondaryColor = '#065F46',
  accentColor = '#059669',
  showDownloadButton = true,
  showFullscreenButton = true,
  showSkipButtons = true,
  onClose // Nova prop
}: VideoPlayerProps) {
  // Estados para controlar o player de vídeo
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  
  // Referências para elementos do DOM
  const videoRef = useRef<HTMLVideoElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para alternar entre play e pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  // Função para alterar o volume
  const handleVolumeChange = useCallback((newVolume: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume[0]
      setVolume(newVolume[0])
    }
  }, [])

  // Função para mostrar/esconder o slider de volume
  const toggleVolumeSlider = useCallback(() => {
    setShowVolumeSlider(prev => !prev)
  }, [])

  // Função para atualizar o progresso do vídeo
  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(currentProgress)
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  // Função para buscar uma posição específica no vídeo
  const handleSeek = useCallback((newProgress: number[]) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (newProgress[0] / 100) * videoRef.current.duration
      videoRef.current.currentTime = time
      setProgress(newProgress[0])
      setCurrentTime(time)
    }
  }, [])

  // Função para alternar o modo tela cheia
  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }, [])

  // Função para avançar ou retroceder o vídeo
  const handleSkip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }, [])

  // Função para formatar o tempo em minutos:segundos
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // Função para mostrar os controles temporariamente
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

  // Função para baixar o vídeo
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = title || 'video.mp4'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar o vídeo:', error)
    }
  }, [src, title])

  // Função para lidar com o carregamento dos metadados do vídeo
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }, [])

  // Efeito para adicionar event listeners ao vídeo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', () => setIsPlaying(true))
    video.addEventListener('pause', () => setIsPlaying(false))
    video.addEventListener('volumechange', () => setVolume(video.volume))

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', () => setIsPlaying(true))
      video.removeEventListener('pause', () => setIsPlaying(false))
      video.removeEventListener('volumechange', () => setVolume(video.volume))
    }
  }, [handleLoadedMetadata])

  // Efeito para fechar o slider de volume ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      className="w-full h-full bg-black rounded-t-lg overflow-hidden shadow-lg relative"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
      style={{ 
        '--primary-color': primaryColor, 
        '--secondary-color': secondaryColor, 
        '--accent-color': accentColor,
        boxShadow: '0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.5), 0 0 30px rgba(0, 0, 255, 0.5)',
        animation: 'rgb-border 5s linear infinite'
      } as React.CSSProperties}
    >
      <style jsx>{`
        @keyframes rgb-border {
          0% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.5), 0 0 30px rgba(0, 0, 255, 0.5); }
          33% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.5), 0 0 20px rgba(0, 0, 255, 0.5), 0 0 30px rgba(255, 0, 0, 0.5); }
          66% { box-shadow: 0 0 10px rgba(0, 0, 255, 0.5), 0 0 20px rgba(255, 0, 0, 0.5), 0 0 30px rgba(0, 255, 0, 0.5); }
          100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.5), 0 0 30px rgba(0, 0, 255, 0.5); }
        }
      `}</style>
      {/* Botão de fechar */}
      {onClose && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-2 right-2 text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50 z-50"
          aria-label="Fechar vídeo"
        >
          <X className="h-6 w-6" />
        </Button>
      )}
      {/* Indicador de carregamento */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[var(--primary-color)]"></div>
        </div>
      )}
      {/* Container do vídeo */}
      <div className="aspect-video max-h-[80vh] flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleProgress}
          src={src}
          aria-label="Video player"
          onClick={togglePlay}
        />
      </div>
      {/* Controles do player */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
          <div className="flex flex-col space-y-2">
            {/* Barra de progresso */}
            <Slider
              className="w-full [&>span:first-child]:bg-[var(--primary-color)] [&_[role=slider]]:bg-[var(--primary-color)]"
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              aria-label="Video progress"
            />
            <div className="flex items-center justify-between space-x-4">
              {/* Botões de controle */}
              <div className="flex items-center space-x-2">
                {showSkipButtons && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleSkip(-10)} 
                    className="text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50"
                    aria-label="Rewind 10 seconds"
                  >
                    <Rewind className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={togglePlay} 
                  className="text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                {showSkipButtons && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleSkip(10)} 
                    className="text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50"
                    aria-label="Fast forward 10 seconds"
                  >
                    <FastForward className="h-4 w-4" />
                  </Button>
                )}
                {showDownloadButton && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleDownload} 
                    className="text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50"
                    aria-label="Download video"
                  >
                    <Download className="h-6 w-6" />
                  </Button>
                )}
              </div>
              {/* Exibição do tempo atual e duração total */}
              <div className="text-[var(--primary-color)] text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              {/* Controles de volume e tela cheia */}
              <div className="flex items-center space-x-2">
                <div className="relative" ref={volumeSliderRef}>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleVolumeSlider}
                    className="text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50"
                    aria-label={volume === 0 ? "Unmute" : "Mute"}
                  >
                    {volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                  </Button>
                  {/* Slider de volume */}
                  {showVolumeSlider && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black bg-opacity-75 p-2 rounded-md">
                      <div className="flex items-center">
                        <div className="w-1 h-24 bg-[var(--secondary-color)] rounded-full overflow-hidden">
                          <div 
                            className="w-full bg-[var(--primary-color)] transition-all duration-200"
                            style={{ height: `${volume * 100}%` }}
                          />
                        </div>
                        <Slider
                          className="h-24 ml-[-9px] [&>span:first-child]:bg-transparent [&_[role=slider]]:bg-[var(--primary-color)]"
                          orientation="vertical"
                          value={[volume]}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                          aria-label="Volume control"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {showFullscreenButton && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleFullscreen} 
                    className="text-[var(--primary-color)] hover:bg-[var(--secondary-color)] hover:bg-opacity-50"
                    aria-label="Fullscreen"
                  >
                    <Maximize className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}