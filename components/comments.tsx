import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { MessageSquare, Send, ChevronUp, ChevronDown } from 'lucide-react'

interface Comment {
  id: string
  username: string
  content: string
  created_at: string
}

interface CommentsProps {
  comments: Comment[]
  onAddComment: (content: string) => void
  username: string | null
}

export function Comments({ comments, onAddComment, username }: CommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-black bg-opacity-80 border border-green-500 rounded-lg p-4 mt-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 opacity-20"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-green-400 flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Comentários
          </h3>
          <Button 
            onClick={() => setShowComments(!showComments)} 
            variant="outline"
            size="sm"
            className="bg-green-900 hover:bg-green-800 text-green-400 border-green-500"
          >
            {showComments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: showComments ? 1 : 0, height: showComments ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
        >
          {username && (
            <form onSubmit={handleSubmit} className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="w-full p-2 bg-black text-green-400 border border-green-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
              <Button 
                type="submit" 
                className="mt-2 bg-green-600 hover:bg-green-700 text-black flex items-center"
              >
                <Send size={16} className="mr-2" />
                Enviar Comentário
              </Button>
            </form>
          )}
          <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900 bg-opacity-20 p-3 rounded-lg border border-green-500 border-opacity-30"
              >
                <p className="font-bold text-green-400">{comment.username}</p>
                <p className="text-green-300 mt-1">{comment.content}</p>
                <p className="text-xs text-green-500 mt-2">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}