/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Upload } from 'lucide-react';

interface RankingItem {
  username: string;
  upload_count: number;
}

export function UserRanking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch('/api/user-ranking');
        if (response.ok) {
          const data = await response.json();
          setRanking(data);
        } else {
          console.error('Failed to fetch ranking');
        }
      } catch (error) {
        console.error('Error fetching ranking:', error);
      }
    };

    fetchRanking();
    const interval = setInterval(fetchRanking, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-lg border-2 border-green-400 text-green-400 w-full h-full shadow-lg shadow-green-500/30 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <h2 className="text-4xl font-bold mb-6 text-center glitch-text neon-text" data-text="Ranking Poggers">
        <Trophy className="inline-block mr-2 mb-1" size={36} />
        Ranking Poggers
      </h2>
      <ul className="space-y-3 relative z-10">
        {ranking.length > 0 ? (
          ranking.map((item, index) => (
            <motion.li
              key={item.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex justify-between items-center py-3 border-b border-green-500 last:border-b-0 hover:bg-green-900/20 rounded-md px-2 group"
            >
              <motion.span
                className="text-xl flex items-center"
                whileHover={{ scale: 1.05, color: '#00FF00' }}
              >
                <span className="mr-3 font-mono text-2xl font-bold">{(index + 1).toString().padStart(2, '0')}</span>
                <span className="truncate">{item.username}</span>
              </motion.span>
              <motion.span
                className="font-bold text-base bg-green-500 text-black px-3 py-1 rounded-full shadow-md flex items-center"
                whileHover={{ scale: 1.1, backgroundColor: '#00FF00' }}
              >
                <Upload className="mr-1" size={16} />
                {item.upload_count}
              </motion.span>
            </motion.li>
          ))
        ) : (
          <li className="text-center text-xl italic">No uploads yet</li>
        )}
      </ul>
    </motion.div>
  );
}