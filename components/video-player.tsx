'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Rewind, FastForward, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface VideoPlayerProps {
  src: string
  title: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  showDownloadButton?: boolean
  showFullscreenButton?: boolean
  showSkipButtons?: boolean
}

export function VideoPlayer({
  src,
  title,
  primaryColor = '#10B981',
  secondaryColor = '#065F46',
  accentColor = '#059669',
  showDownloadButton = true,
  showFullscreenButton = true,
  showSkipButtons = true
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume[0]
      setVolume(newVolume[0])
    }
  }, [])

  const toggleVolumeSlider = useCallback(() => {
    setShowVolumeSlider(prev => !prev)
  }, [])

  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(currentProgress)
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleSeek = useCallback((newProgress: number[]) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (newProgress[0] / 100) * videoRef.current.duration
      videoRef.current.currentTime = time
      setProgress(newProgress[0])
      setCurrentTime(time)
    }
  }, [])

  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }, [])

  const handleSkip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }, [])

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

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

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      })
    }
  }, [])

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
      className="w-full h-full bg-black rounded-lg overflow-hidden shadow-lg relative"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setShowControls(false)}
      style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor, '--accent-color': accentColor } as React.CSSProperties}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[var(--primary-color)]"></div>
        </div>
      )}
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
      <div className={`absolute inset-0 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
          <div className="flex flex-col space-y-2">
            <Slider
              className="w-full [&>span:first-child]:bg-[var(--primary-color)] [&_[role=slider]]:bg-[var(--primary-color)]"
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              aria-label="Video progress"
            />
            <div className="flex items-center justify-between space-x-4">
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
              <div className="text-[var(--primary-color)] text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
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