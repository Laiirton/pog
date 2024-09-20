/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useCallback } from 'react';

export function useImagePreloader() {
  // Estado para armazenar o cache das imagens
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  // Função para pré-carregar uma imagem
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        // Atualiza o cache com a imagem carregada
        setImageCache(prev => ({ ...prev, [src]: src }));
        resolve();
      };
      img.onerror = reject;
    });
  }, []);

  // Função para obter uma imagem do cache
  const getCachedImage = useCallback((src: string): string | null => {
    return imageCache[src] || null;
  }, [imageCache]);

  return { preloadImage, getCachedImage };
}