/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useCallback } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function useImagePreloader() {
  // Estado para armazenar o cache das imagens
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  // Função para pré-carregar uma imagem
  const preloadImage = useCallback((src: string, retries = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Verifica se a imagem já está no cache
      if (imageCache[src]) {
        resolve();
        return;
      }

      const img = new Image();
      img.src = src;
      img.onload = () => {
        // Atualiza o cache com a imagem carregada
        setImageCache(prev => ({ ...prev, [src]: src }));
        resolve();
      };
      img.onerror = () => {
        if (retries < MAX_RETRIES) {
          setTimeout(() => {
            preloadImage(src, retries + 1)
              .then(resolve)
              .catch(reject);
          }, RETRY_DELAY);
        } else {
          reject(new Error(`Failed to load image after ${MAX_RETRIES} retries`));
        }
      };
    });
  }, [imageCache]);

  // Função para obter uma imagem do cache
  const getCachedImage = useCallback((src: string): string | null => {
    return imageCache[src] || null;
  }, [imageCache]);

  // Função para pré-carregar várias imagens de uma vez
  const preloadImages = useCallback((srcs: string[]): Promise<void[]> => {
    return Promise.all(srcs.map(src => preloadImage(src)));
  }, [preloadImage]);

  return { preloadImage, getCachedImage, preloadImages, imageCache };
}