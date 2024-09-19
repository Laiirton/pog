'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileImage, FileVideo, Loader } from 'lucide-react'

interface MediaUploadProps {
  onUploadSuccess: () => void;
}

export function MediaUpload({ onUploadSuccess }: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setFileName(event.target.files[0].name)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0])
      setFileName(event.dataTransfer.files[0].name)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeFile = () => {
    setFile(null)
    setFileName('')
  }

  const handleUpload = useCallback(async () => {
    if (file && fileName) {
      setIsUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', fileName)

      // Get username from localStorage
      const username = localStorage.getItem('username')
      if (username) {
        formData.append('username', username)
      } else {
        setUploadError('User not authenticated')
        setIsUploading(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDIA_API_URL}/upload`, {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        console.log('File uploaded successfully:', result)
        
        setFile(null)
        setFileName('')
        onUploadSuccess()
      } catch (error) {
        console.error('Error uploading:', error)
        setUploadError(error instanceof Error ? error.message : 'Unknown upload error')
      } finally {
        setIsUploading(false)
      }
    }
  }, [file, fileName, onUploadSuccess])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-black bg-opacity-80 rounded-lg shadow-lg border-2 border-green-500 overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-3xl font-bold text-green-400 text-center mb-4">Pog Gallery Uploader</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging ? 'border-green-400 bg-green-900 bg-opacity-20' : 'border-green-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center space-x-4">
                {file.type.startsWith('image/') ? (
                  <FileImage className="text-green-500" size={32} />
                ) : (
                  <FileVideo className="text-green-500" size={32} />
                )}
                <span className="text-green-500 truncate max-w-[200px]">{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="text-red-500 hover:text-red-400">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto text-green-500" size={48} />
                <p className="text-green-500">Drag and drop your media file here, or click to select</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter desired file name"
              className="w-full p-2 bg-black bg-opacity-50 border border-green-500 rounded text-green-400 placeholder-green-600"
            />
            <div className="flex space-x-4">
              <button
                onClick={handleUpload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-4 rounded transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={!file || !fileName || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Uploading...
                  </>
                ) : (
                  'Upload to Pog Gallery'
                )}
              </button>
              <button
                onClick={onUploadSuccess}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors duration-300"
              >
                Cancel
              </button>
            </div>
            {uploadError && (
              <p className="text-red-500 text-sm">{uploadError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}