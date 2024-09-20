/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useCallback } from 'react';

export function useImagePreloader() {
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageCache(prev => ({ ...prev, [src]: src }));
        resolve();
      };
      img.onerror = reject;
    });
  }, []);

  const getCachedImage = useCallback((src: string): string | null => {
    return imageCache[src] || null;
  }, [imageCache]);

  return { preloadImage, getCachedImage };
}