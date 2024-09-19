import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RankingItem {
  username: string;
  upload_count: number;
}

export function UserRanking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDIA_API_URL}/user-ranking`);
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-black bg-opacity-60 p-6 rounded-lg border border-green-500 text-green-500 w-full h-full"
    >
      <h2 className="text-3xl font-bold mb-4 text-center glitch" data-text="Top Poggers">Top Poggers</h2>
      <ul className="space-y-2">
        {ranking.length > 0 ? (
          ranking.map((item, index) => (
            <motion.li
              key={item.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex justify-between items-center py-2 border-b border-green-500 last:border-b-0"
            >
              <motion.span
                className="text-lg"
                whileHover={{ scale: 1.1, color: '#00FF00' }}
              >
                {index + 1}. {item.username}
              </motion.span>
              <motion.span
                className="font-bold text-sm bg-green-500 text-black px-2 py-1 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: '#00FF00' }}
              >
                {item.upload_count}
              </motion.span>
            </motion.li>
          ))
        ) : (
          <li className="text-center text-lg">No uploads yet</li>
        )}
      </ul>
    </motion.div>
  );
}