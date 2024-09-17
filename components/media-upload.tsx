'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileImage, FileVideo } from 'lucide-react'

export function MediaUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleUpload = () => {
    if (file && fileName) {
      // Here you would implement the actual file upload logic
      console.log(`Uploading file: ${fileName}`)
      // Reset the form after upload
      setFile(null)
      setFileName('')
    }
  }

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
            <button
              onClick={handleUpload}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-bold py-3 px-4 rounded transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!file || !fileName}
            >
              Upload to Pog Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}