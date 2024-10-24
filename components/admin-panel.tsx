'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  FileType, 
  Settings, 
  Trash2, 
  Edit, 
  Ban, 
  Shield, 
  Activity,
  BarChart2,
  RefreshCcw,
  Save,
  X
} from 'lucide-react'
import { Button } from './ui/button'

interface User {
  id: string
  username: string
  role: string
  status: string
  createdAt: string
  lastLogin: string
}

interface MediaStats {
  totalMedia: number
  totalImages: number
  totalVideos: number
  totalComments: number
  totalVotes: number
}

interface AdminPanelProps {
  onClose: () => void
  adminToken: string
}

export function AdminPanel({ onClose, adminToken }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Buscar estatísticas e dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          fetch('/api/admin/stats', {
            headers: { 'admin-token': adminToken }
          }),
          fetch('/api/admin/users', {
            headers: { 'admin-token': adminToken }
          })
        ])

        if (statsResponse.ok && usersResponse.ok) {
          const [stats, userData] = await Promise.all([
            statsResponse.json(),
            usersResponse.json()
          ])
          setMediaStats(stats)
          setUsers(userData)
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [adminToken])

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'admin-token': adminToken 
        }
      })

      if (response.ok) {
        // Atualizar lista de usuários
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            return { ...user, status: action === 'ban' ? 'banned' : 'active' }
          }
          return user
        })
        setUsers(updatedUsers)
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
    }
  }

  const handleSaveUserEdit = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-token': adminToken
        },
        body: JSON.stringify(editingUser)
      })

      if (response.ok) {
        const updatedUsers = users.map(user => 
          user.id === editingUser.id ? editingUser : user
        )
        setUsers(updatedUsers)
        setEditingUser(null)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-95 text-green-500 overflow-y-auto"
    >
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button
            onClick={onClose}
            variant="destructive"
            className="hover:bg-red-700"
          >
            <X className="mr-2" size={20} />
            Close Panel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sidebar com navegação */}
          <div className="bg-black border border-green-500 rounded-lg p-4">
            <nav className="space-y-2">
              <Button
                className={`w-full justify-start ${activeTab === 'dashboard' ? 'bg-green-700' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Activity className="mr-2" size={20} />
                Dashboard
              </Button>
              <Button
                className={`w-full justify-start ${activeTab === 'users' ? 'bg-green-700' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users className="mr-2" size={20} />
                Users
              </Button>
              <Button
                className={`w-full justify-start ${activeTab === 'media' ? 'bg-green-700' : ''}`}
                onClick={() => setActiveTab('media')}
              >
                <FileType className="mr-2" size={20} />
                Media
              </Button>
              <Button
                className={`w-full justify-start ${activeTab === 'settings' ? 'bg-green-700' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="mr-2" size={20} />
                Settings
              </Button>
            </nav>
          </div>

          {/* Área principal de conteúdo */}
          <div className="md:col-span-3 bg-black border border-green-500 rounded-lg p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                  {mediaStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard
                        title="Total Media"
                        value={mediaStats.totalMedia}
                        icon={<FileType size={24} />}
                      />
                      <StatCard
                        title="Total Comments"
                        value={mediaStats.totalComments}
                        icon={<BarChart2 size={24} />}
                      />
                      <StatCard
                        title="Total Votes"
                        value={mediaStats.totalVotes}
                        icon={<Activity size={24} />}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Users Management</h2>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 bg-black border border-green-500 rounded-lg"
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-500">
                          <th className="px-4 py-2 text-left">Username</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b border-green-500/30">
                            <td className="px-4 py-2">{user.username}</td>
                            <td className="px-4 py-2">{user.role}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                user.status === 'banned' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={user.status === 'banned' ? 'default' : 'destructive'}
                                  onClick={() => handleUserAction(user.id, user.status === 'banned' ? 'unban' : 'ban')}
                                >
                                  {user.status === 'banned' ? <Shield size={16} /> : <Ban size={16} />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUserAction(user.id, 'delete')}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Modal de edição de usuário */}
              {editingUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center"
                >
                  <div className="bg-black border border-green-500 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Edit User</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2">Username</label>
                        <input
                          type="text"
                          value={editingUser.username}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            username: e.target.value
                          })}
                          className="w-full px-4 py-2 bg-black border border-green-500 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block mb-2">Role</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            role: e.target.value
                          })}
                          className="w-full px-4 py-2 bg-black border border-green-500 rounded-lg"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button onClick={() => setEditingUser(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveUserEdit} className="bg-green-600">
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Componente para os cards de estatísticas
function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-black border border-green-500 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
