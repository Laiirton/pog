'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

export function VideoPlayer({ src }: { src: string }) { // Adicione a prop 'src'
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeSliderRef.current && !volumeSliderRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume[0]
      setVolume(newVolume[0])
    }
  }

  const toggleVolumeSlider = () => setShowVolumeSlider(!showVolumeSlider)

  const handleProgress = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleSeek = (newProgress: number[]) => {
    if (videoRef.current) {
      const time = (newProgress[0] / 100) * videoRef.current.duration
      videoRef.current.currentTime = time
      setProgress(newProgress[0])
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) videoRef.current.requestFullscreen()
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
      <div className="p-4 bg-green-900 text-green-500">
        <h2 className="text-2xl font-mono text-center">Hack the Planet</h2>
      </div>
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full"
          onTimeUpdate={handleProgress}
          src={src} // Use a prop 'src' aqui
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
          <div className="flex items-center space-x-4">
            <Button size="icon" variant="ghost" onClick={togglePlay} className="text-green-500 hover:bg-green-900 hover:bg-opacity-50">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Slider
              className="flex-grow [&>span:first-child]:bg-green-500 [&_[role=slider]]:bg-green-500"
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
            />
            <div className="relative" ref={volumeSliderRef}>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleVolumeSlider}
                className="text-green-500 hover:bg-green-900 hover:bg-opacity-50"
              >
                {volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </Button>
              {showVolumeSlider && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black bg-opacity-75 p-2 rounded-md">
                  <div className="flex items-center">
                    <div className="w-1 h-24 bg-green-900 rounded-full overflow-hidden">
                      <div 
                        className="w-full bg-green-500 transition-all duration-200"
                        style={{ height: `${volume * 100}%` }}
                      />
                    </div>
                    <Slider
                      className="h-24 ml-[-9px] [&>span:first-child]:bg-transparent [&_[role=slider]]:bg-green-500"
                      orientation="vertical"
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>
              )}
            </div>
            <Button size="icon" variant="ghost" onClick={handleFullscreen} className="text-green-500 hover:bg-green-900 hover:bg-opacity-50">
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}