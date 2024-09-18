'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabase'

interface RegisterProps {
  onRegistrationComplete: () => void;
}

export function Register({ onRegistrationComplete }: RegisterProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Check if the username already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('usernames')
        .select()
        .eq('username', username)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingUser) {
        // User exists, proceed with login
        console.log('User logged in:', existingUser)
      } else {
        // User doesn't exist, create new user
        const { data: newUser, error: insertError } = await supabase
          .from('usernames')
          .insert({ username })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        console.log('New user registered:', newUser)
      }

      // Call the onRegistrationComplete callback
      onRegistrationComplete()
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')]">
      <div className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg border border-green-500 w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-500">Pog Gallery</h1>
        <h2 className="text-xl font-semibold mb-4 text-center text-green-400">Register / Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-green-500 rounded-md text-green-500 placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-md transition-colors duration-300 ease-in-out transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Register / Login'}
          </Button>
        </form>
      </div>
    </div>
  )
}