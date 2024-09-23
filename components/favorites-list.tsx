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
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="fixed left-0 top-0 h-full w-80 bg-black bg-opacity-90 border-r-2 border-green-500 overflow-y-auto z-50"
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-green-500">Favoritos</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="text-green-500 hover:bg-green-900 hover:bg-opacity-50"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <AnimatePresence>
          {favorites.length > 0 ? (
            favorites.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 bg-green-900 bg-opacity-20 rounded-lg overflow-hidden cursor-pointer hover:bg-opacity-30 transition-all duration-300"
                onClick={() => onSelectMedia(item)}
              >
                <div className="relative h-32">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-2">
                  <h3 className="text-green-400 font-semibold truncate">{item.title}</h3>
                  <p className="text-green-300 text-sm">{item.username}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-green-500 text-center italic">Nenhum favorito ainda</p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}