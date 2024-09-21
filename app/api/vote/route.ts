import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const JWT_SECRET = process.env.JWT_SECRET

if (!supabaseUrl || !supabaseKey || !JWT_SECRET) {
  throw new Error('Variáveis de ambiente não estão configuradas corretamente')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface JwtPayload {
  username: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Corpo da requisição:', body)

    const { mediaId, userToken, voteType: initialVoteType } = body

    if (!mediaId) {
      return NextResponse.json({ message: 'mediaId é obrigatório' }, { status: 400 })
    }
    if (!userToken) {
      return NextResponse.json({ message: 'userToken é obrigatório' }, { status: 400 })
    }
    if (initialVoteType !== 1 && initialVoteType !== -1 && initialVoteType !== 0) {
      return NextResponse.json({ message: 'voteType deve ser 1, -1 ou 0' }, { status: 400 })
    }

    let username: string
    try {
      const decoded = jwt.verify(userToken, JWT_SECRET) as JwtPayload
      username = decoded.username
    } catch (error) {
      console.error('Erro ao decodificar o token:', error)
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    let { data: user, error: userError } = await supabase
      .from('usernames')
      .select('id, username, votes')
      .eq('username', username)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('usernames')
          .insert({ username, votes: {} })
          .select()
          .single()

        if (createError) throw createError
        user = newUser
      } else {
        throw userError
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    const votes = user.votes || {}
    const currentVote = votes[mediaId] || 0
    let voteType = initialVoteType

    // Se o voto atual é igual ao novo voto, remova o voto
    if (currentVote === voteType) {
      delete votes[mediaId]
      voteType = 0 // Definir voteType como 0 para remover o voto
    } else {
      votes[mediaId] = voteType
    }

    const { error: updateUserError } = await supabase
      .from('usernames')
      .update({ votes })
      .eq('id', user.id)

    if (updateUserError) throw updateUserError

    try {
      const { data: currentMedia, error: getCurrentError } = await supabase
        .from('media_uploads')
        .select('upvotes, downvotes')
        .eq('file_id', mediaId)
        .single()

      if (getCurrentError) throw getCurrentError
      if (!currentMedia) throw new Error('Mídia não encontrada')

      let newUpvotes = currentMedia.upvotes || 0
      let newDownvotes = currentMedia.downvotes || 0

      // Remover o voto anterior
      if (currentVote === 1) newUpvotes--
      if (currentVote === -1) newDownvotes--

      // Adicionar o novo voto
      if (voteType === 1) newUpvotes++
      if (voteType === -1) newDownvotes++

      const { data: updatedMedia, error: updateMediaError } = await supabase
        .from('media_uploads')
        .update({ upvotes: newUpvotes, downvotes: newDownvotes })
        .eq('file_id', mediaId)
        .select('upvotes, downvotes')
        .single()

      if (updateMediaError) throw updateMediaError

      return NextResponse.json({ 
        message: 'Voto registrado com sucesso',
        upvotes: updatedMedia.upvotes,
        downvotes: updatedMedia.downvotes,
        userVote: voteType
      })
    } catch (error) {
      console.error('Erro ao atualizar mídia:', error)
      return NextResponse.json({ message: 'Erro ao atualizar mídia' }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro ao processar voto:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}