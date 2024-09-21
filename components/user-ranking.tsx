/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowBigUp, ArrowBigDown } from 'lucide-react';

// Define a interface para os itens do ranking
interface RankingItem {
  username: string;
  upload_count: number;
  upvotes: number;
  downvotes: number;
}

export function UserRanking() {
  // Estado para armazenar os dados do ranking
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    // Função para buscar os dados do ranking
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

    // Chama a função fetchRanking imediatamente
    fetchRanking();
    // Configura um intervalo para atualizar o ranking a cada minuto
    const interval = setInterval(fetchRanking, 60000); // Update every minute
    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval);
  }, []);

  return (
    // Container principal do ranking
    <div className="bg-orange-900 bg-opacity-20 p-6 rounded-lg border-2 border-orange-400 text-orange-400 w-full h-full shadow-lg shadow-orange-500/30 relative overflow-hidden">
      {/* Título do ranking */}
      <h2 className="text-3xl font-bold mb-6 text-center text-orange-300" data-text="Ranking Poggers">
        <Trophy className="inline-block mr-2 mb-1" size={28} />
        The Poggers
      </h2>
      {/* Lista de usuários no ranking */}
      <ul className="space-y-3 relative z-10">
        {ranking.length > 0 ? (
          // Mapeia os 5 primeiros itens do ranking
          ranking.map((item, index) => (
            // Cada item do ranking com animação
            <motion.li
              key={item.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex justify-between items-center py-2 border-b border-orange-500 last:border-b-0 hover:bg-orange-900/30 rounded-md px-2 group"
            >
              <span className="text-lg flex items-center">
                {/* Número da posição no ranking */}
                <span className="mr-3 font-mono text-xl font-bold text-orange-300">{(index + 1).toString().padStart(2, '0')}</span>
                {/* Nome do usuário */}
                <span className="truncate">{item.username}</span>
              </span>
              {/* Contagem de upvotes e downvotes */}
              <div className="flex items-center space-x-2">
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
          ))
        ) : (
          // Mensagem exibida quando não há uploads
          <li className="text-center text-xl italic text-orange-300">No uploads yet</li>
        )}
      </ul>
    </div>
  );
}