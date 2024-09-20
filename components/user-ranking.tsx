/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Upload } from 'lucide-react';

// Define a interface para os itens do ranking
interface RankingItem {
  username: string;
  upload_count: number;
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
    <div className="bg-gray-900 bg-opacity-70 p-6 rounded-lg border-2 border-cyan-400 text-cyan-400 w-full h-full shadow-lg shadow-cyan-500/30 relative overflow-hidden">
      {/* Título do ranking */}
      <h2 className="text-3xl font-bold mb-6 text-center" data-text="Ranking Poggers">
        <Trophy className="inline-block mr-2 mb-1" size={28} />
        The Poggers
      </h2>
      {/* Lista de usuários no ranking */}
      <ul className="space-y-3 relative z-10">
        {ranking.length > 0 ? (
          // Mapeia os 5 primeiros itens do ranking
          ranking.slice(0, 5).map((item, index) => (
            // Cada item do ranking com animação
            <motion.li
              key={item.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex justify-between items-center py-2 border-b border-cyan-500 last:border-b-0 hover:bg-cyan-900/20 rounded-md px-2 group"
            >
              <span className="text-lg flex items-center">
                {/* Número da posição no ranking */}
                <span className="mr-3 font-mono text-xl font-bold">{(index + 1).toString().padStart(2, '0')}</span>
                {/* Nome do usuário */}
                <span className="truncate">{item.username}</span>
              </span>
              {/* Contagem de uploads */}
              <span className="font-bold text-sm bg-cyan-500 text-black px-2 py-1 rounded-full shadow-md flex items-center">
                <Upload className="mr-1" size={14} />
                {item.upload_count}
              </span>
            </motion.li>
          ))
        ) : (
          // Mensagem exibida quando não há uploads
          <li className="text-center text-xl italic">No uploads yet</li>
        )}
      </ul>
    </div>
  );
}