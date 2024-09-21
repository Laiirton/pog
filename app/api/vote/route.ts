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

interface MediaUpload {
  vote_count: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Corpo da requisição:', body)

    const { mediaId, userToken, voteType } = body

    if (!mediaId) {
      return NextResponse.json({ message: 'mediaId é obrigatório' }, { status: 400 })
    }
    if (!userToken) {
      return NextResponse.json({ message: 'userToken é obrigatório' }, { status: 400 })
    }
    if (voteType !== 1 && voteType !== -1) {
      return NextResponse.json({ message: 'voteType deve ser 1 ou -1' }, { status: 400 })
    }

    let username: string
    try {
      const decoded = jwt.verify(userToken, JWT_SECRET) as JwtPayload
      username = decoded.username
      console.log('Token decodificado com sucesso:', decoded)
    } catch (error) {
      console.error('Erro ao decodificar o token:', error)
      if (error instanceof Error) {
        return NextResponse.json({ message: 'Token inválido', error: error.message }, { status: 401 })
      } else {
        return NextResponse.json({ message: 'Token inválido', error: 'Erro desconhecido' }, { status: 401 })
      }
    }

    let { data: user, error: userError } = await supabase
      .from('usernames')
      .select('id, username, score, votes')
      .eq('username', username)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        const { data: newUser, error: createError } = await supabase
          .from('usernames')
          .insert({ username, score: 0, votes: {} })
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

    console.log('Usuário encontrado:', user)

    const votes = user.votes || {}
    const currentVote = votes[mediaId] || 0
    const scoreDiff = voteType - currentVote

    votes[mediaId] = voteType
    const newScore = user.score + scoreDiff

    const { error: updateUserError } = await supabase
      .from('usernames')
      .update({ votes, score: newScore })
      .eq('id', user.id)

    if (updateUserError) {
      console.error('Erro ao atualizar usuário:', updateUserError)
      throw updateUserError
    }

    console.log('Atualizando contagem de votos da mídia')
    console.log('mediaId:', mediaId)
    console.log('scoreDiff:', scoreDiff)

    try {
      // Primeiro, vamos obter o valor atual de vote_count
      const { data: currentMedia, error: getCurrentError } = await supabase
        .from('media_uploads')
        .select('vote_count')
        .eq('file_id', mediaId)
        .single()

      if (getCurrentError) {
        console.error('Erro ao obter contagem atual de votos:', getCurrentError)
        throw getCurrentError
      }

      if (!currentMedia) {
        throw new Error('Mídia não encontrada')
      }

      // Agora, vamos calcular o novo valor de vote_count
      const newVoteCount = (currentMedia.vote_count || 0) + scoreDiff

      // Em seguida, atualizamos diretamente o valor de vote_count
      const { data: updatedMedia, error: updateMediaError } = await supabase
        .from('media_uploads')
        .update({ vote_count: newVoteCount })
        .eq('file_id', mediaId)
        .select('vote_count')
        .single()

      if (updateMediaError) {
        console.error('Erro ao atualizar mídia:', updateMediaError)
        throw updateMediaError
      }

      console.log('Mídia atualizada:', updatedMedia)

      return NextResponse.json({ 
        message: 'Voto registrado com sucesso',
        voteCount: updatedMedia.vote_count,
        userScore: newScore
      })
    } catch (error) {
      console.error('Erro detalhado ao atualizar mídia:', error)
      if (error instanceof Error) {
        return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 })
      } else {
        return NextResponse.json({ message: 'Erro interno do servidor', error: 'Erro desconhecido' }, { status: 500 })
      }
    }

    console.log('Voto registrado com sucesso:', { voteCount: updatedMedia.vote_count, userScore: newScore })

    return NextResponse.json({ 
      message: 'Voto registrado com sucesso',
      voteCount: updatedMedia.vote_count,
      userScore: newScore
    })
  } catch (error) {
    console.error('Erro detalhado ao processar voto:', error)
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ message: 'Erro interno do servidor', error: 'Erro desconhecido' }, { status: 500 })
    }
  }
}