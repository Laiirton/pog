/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Users, 
  Film, 
  MessageSquare, 
  Heart, 
  ChevronDown, 
  ChevronUp,
  Search,
  RefreshCw,
  X,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface MediaUpload {
  id: number;
  file_id: string;
  file_name: string;
  mime_type: string;
  username: string;
  created_at: string;
  google_drive_link: string;
  thumbnail_link: string;
  vote_count: number;
  upvotes: number;
  downvotes: number;
}

interface Comment {
  id: string;
  media_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Username {
  id: number;
  username: string;
  created_at: string;
  votes: Record<string, any>;
}

interface UserFavorite {
  id: number;
  username: string;
  media_id: string;
  created_at: string;
}

interface AdminPanelProps {
  onClose: () => void;
  adminToken: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, adminToken }) => {
  const [activeTab, setActiveTab] = useState<'media' | 'users' | 'comments' | 'favorites'>('media');
  const [mediaData, setMediaData] = useState<MediaUpload[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<Username[]>([]);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mediaRes, commentsRes, usersRes, favoritesRes] = await Promise.all([
        fetch('/api/admin/media', {
          headers: { 'admin-token': adminToken }
        }),
        fetch('/api/admin/comments', {
          headers: { 'admin-token': adminToken }
        }),
        fetch('/api/admin/users', {
          headers: { 'admin-token': adminToken }
        }),
        fetch('/api/admin/favorites', {
          headers: { 'admin-token': adminToken }
        })
      ]);

      const [mediaData, commentsData, usersData, favoritesData] = await Promise.all([
        mediaRes.json(),
        commentsRes.json(),
        usersRes.json(),
        favoritesRes.json()
      ]);

      setMediaData(mediaData);
      setComments(commentsData);
      setUsers(usersData);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminToken]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'admin-token': adminToken }
      });

      if (response.ok) {
        await fetchData();
      } else {
        throw new Error(`Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    });
  };

  const filterData = (data: any[]) => {
    return data.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const renderTable = () => {
    let data: any[] = [];
    let columns: string[] = [];

    switch (activeTab) {
      case 'media':
        data = mediaData;
        columns = ['file_name', 'username', 'created_at', 'upvotes', 'downvotes'];
        break;
      case 'users':
        data = users;
        columns = ['username', 'created_at'];
        break;
      case 'comments':
        data = comments;
        columns = ['username', 'content', 'created_at'];
        break;
      case 'favorites':
        data = favorites;
        columns = ['username', 'media_id', 'created_at'];
        break;
    }

    const filteredData = filterData(sortData(data));

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-900 bg-opacity-30">
              {columns.map(column => (
                <th
                  key={column}
                  className="p-3 text-left cursor-pointer hover:bg-green-800 transition-colors"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.charAt(0).toUpperCase() + column.slice(1)}</span>
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-green-500 border-opacity-30 hover:bg-green-900 hover:bg-opacity-20"
              >
                {columns.map(column => (
                  <td key={column} className="p-3">
                    {column === 'created_at'
                      ? format(new Date(item[column]), 'yyyy-MM-dd HH:mm:ss')
                      : String(item[column])}
                  </td>
                ))}
                <td className="p-3 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-1 text-green-400 hover:text-green-200 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(activeTab, item.id)}
                      className="p-1 text-red-400 hover:text-red-200 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-95 z-50 overflow-hidden flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black border-2 border-green-500 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden relative"
      >
        <div className="p-4 border-b border-green-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-green-500">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-green-500 hover:text-green-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'media' ? 'bg-green-600 text-black' : 'text-green-500'
              }`}
            >
              <Film size={18} />
              <span>Media</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'users' ? 'bg-green-600 text-black' : 'text-green-500'
              }`}
            >
              <Users size={18} />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'comments' ? 'bg-green-600 text-black' : 'text-green-500'
              }`}
            >
              <MessageSquare size={18} />
              <span>Comments</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'favorites' ? 'bg-green-600 text-black' : 'text-green-500'
              }`}
            >
              <Heart size={18} />
              <span>Favorites</span>
            </button>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-green-500 rounded px-4 py-2 pl-10 text-green-500 focus:outline-none focus:border-green-400"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
            </div>
            <button
              onClick={handleRefresh}
              className={`ml-4 p-2 text-green-500 hover:text-green-300 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin text-green-500">
                <RefreshCw size={32} />
              </div>
            </div>
          ) : (
            renderTable()
          )}
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black border-2 border-green-500 rounded-lg p-6 max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-green-500">Item Details</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-green-500 hover:text-green-300"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  {Object.entries(selectedItem).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-4">
                      <div className="flex items-center space-x-2 min-w-[150px]">
                        {key === 'created_at' && <Calendar size={18} className="text-green-500" />}
                        {key === 'username' && <User size={18} className="text-green-500" />}
                        <span className="text-green-500 font-semibold">
                          {key.charAt(0).toUpperCase() + key.slice(1)}:
                        </span>
                      </div>
                      <span className="text-green-400">
                        {key === 'created_at'
                          ? format(new Date(value as string), 'yyyy-MM-dd HH:mm:ss')
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
