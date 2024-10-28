/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowBigUp, ArrowBigDown, Upload } from 'lucide-react';

// Define a interface para os itens do ranking
interface RankingItem {
  username: string;
  upload_count: number;
  upvotes: number;
  downvotes: number;
  total_score: number;
  last_updated: string;
}

export function UserRanking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user-ranking');
      if (!response.ok) {
        throw new Error('Failed to load ranking');
      }
      const data = await response.json();
      setRanking(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      setError('Failed to load ranking');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Atualiza apenas quando o componente é montado
  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return (
    <div className="bg-blue-900 bg-opacity-20 p-6 rounded-lg border-2 border-cyan-400 text-cyan-400 w-full h-full shadow-lg shadow-cyan-500/30 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-center text-cyan-300 flex-grow" data-text="Ranking Poggers">
          <Trophy className="inline-block mr-2 mb-1" size={28} />
          The Poggers
        </h2>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-400 py-4">{error}</div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl text-cyan-300 italic">No uploads yet...</p>
          <p className="text-sm text-cyan-400 mt-2">Be the first to upload!</p>
        </div>
      ) : (
        <ul className="space-y-3 relative z-10">
          {ranking.map((item, index) => (
            <motion.li
              key={`${item.username}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex justify-between items-center py-2 border-b border-cyan-500 last:border-b-0 hover:bg-blue-900/30 rounded-md px-2 group"
            >
              <div className="flex flex-col">
                <span className="text-lg flex items-center">
                  <span className="mr-3 font-mono text-xl font-bold text-cyan-300">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="truncate">{item.username}</span>
                </span>
                <span className="text-sm text-cyan-500 flex items-center ml-8 mt-1">
                  <Upload size={14} className="mr-1" />
                  {item.upload_count} uploads
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm bg-cyan-500 text-black px-2 py-1 rounded-full shadow-md flex items-center">
                  <Trophy className="mr-1" size={14} />
                  {item.total_score}
                </span>
                <span className="font-bold text-sm bg-green-500 text-black px-2 py-1 rounded-full shadow-md flex items-center">
                  <ArrowBigUp className="mr-1" size={14} />
                  {item.upvotes}
                </span>
                <span className="font-bold text-sm bg-red-500 text-black px-2 py-1 rounded-full shadow-md flex items-center">
                  <ArrowBigDown className="mr-1" size={14} />
                  {item.downvotes}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
