/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { MediaItem } from './retro-media-gallery'; // Importe a interface MediaItem

interface FavoritesListProps {
  favorites: MediaItem[];
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
}

export function FavoritesList({ favorites, onClose, onSelectMedia }: FavoritesListProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-black bg-opacity-90 border-2 border-purple-500 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-purple-400">Favorites</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-purple-400 hover:bg-purple-900 hover:bg-opacity-50 transition-colors duration-300"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-grow favorites-scrollbar">
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favorites.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-purple-900 bg-opacity-20 rounded-lg overflow-hidden cursor-pointer hover:bg-opacity-30 transition-all duration-300 flex flex-col"
                    onClick={() => onSelectMedia(item)}
                  >
                    <div className="relative h-40">
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-3 flex-grow flex flex-col justify-between">
                      <h3 className="text-purple-400 font-semibold truncate mb-1">{item.title}</h3>
                      <p className="text-purple-300 text-sm">{item.username}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-purple-500 text-xl italic">No favorites yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}