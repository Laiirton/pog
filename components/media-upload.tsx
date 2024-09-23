/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

// Importações necessárias
import { useState, useRef, useCallback } from 'react'

import { Upload, X, FileImage, FileVideo, Loader } from 'lucide-react'

// Adicione esta constante no topo do arquivo, fora do componente
const ALLOWED_FILE_TYPES: { [key: string]: boolean } = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  'image/svg+xml': true,
  'video/mp4': true,
  'video/webm': true,
  'video/ogg': true,
  'video/quicktime': true,
};

// Interface para as props do componente MediaUpload
interface MediaUploadProps {
  onUploadSuccess: () => void;
}

// Componente principal de upload de mídia
export function MediaUpload({ onUploadSuccess }: MediaUploadProps) {
  // Estados para armazenar o arquivo, nome do arquivo, estado de arrastar, etc.
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);

  // Função para lidar com a mudança de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (ALLOWED_FILE_TYPES[file.type]) {
        setFile(file);
        setFileName(file.name);
        setFileTypeError(null);
      } else {
        setFile(null);
        setFileName('');
        setFileTypeError('Tipo de arquivo não permitido. Por favor, selecione uma imagem ou vídeo.');
      }
    }
  }

  // Função para lidar com o drop de arquivo
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (ALLOWED_FILE_TYPES[file.type]) {
        setFile(file);
        setFileName(file.name);
        setFileTypeError(null);
      } else {
        setFile(null);
        setFileName('');
        setFileTypeError('Tipo de arquivo não permitido. Por favor, selecione uma imagem ou vídeo.');
      }
    }
  }

  // Função para lidar com o drag over
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  // Função para lidar com o drag leave
  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Função para remover o arquivo selecionado
  const removeFile = () => {
    setFile(null)
    setFileName('')
  }

  // Função para lidar com o upload do arquivo
  const handleUpload = useCallback(async () => {
    if (file && fileName) {
      setIsUploading(true)
      setUploadError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', fileName)

      // Obter o username e token do localStorage
      const username = localStorage.getItem('username')
      const token = localStorage.getItem('token')
      if (!username || !token) {
        setUploadError('User not authenticated')
        setIsUploading(false)
        return
      }
      formData.append('username', username)

      try {
        // Verificar novamente o tipo de arquivo antes de enviar
        if (!ALLOWED_FILE_TYPES[file.type]) {
          throw new Error('Tipo de arquivo não permitido.');
        }

        // Enviar o arquivo para a API
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}` // Adicionar o token ao cabeçalho
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const result = await response.json()
        console.log('File uploaded successfully:', result)
        
        // Resetar estados após upload bem-sucedido
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
    // Estrutura do componente de upload
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
            {fileTypeError && (
              <p className="text-red-500 text-sm mt-2">{fileTypeError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}