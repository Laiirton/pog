import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não estão configuradas')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { mediaId, username, voteType } = await request.json()

    if (!mediaId || !username || (voteType !== 1 && voteType !== -1)) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar o usuário e seus votos atuais
    const { data: user, error: userError } = await supabase
      .from('usernames')
      .select('votes, score')
      .eq('username', username)
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        // Usuário não existe, criar novo
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

    const votes = user.votes || {}
    const currentVote = votes[mediaId] || 0
    const scoreDiff = voteType - currentVote

    // Atualizar os votos e o score
    votes[mediaId] = voteType
    const newScore = user.score + scoreDiff

    const { data: updatedUser, error: updateError } = await supabase
      .from('usernames')
      .update({ votes, score: newScore })
      .eq('username', username)
      .select()
      .single()

    if (updateError) throw updateError

    // Atualizar o vote_count na tabela media_uploads
    const { data: media, error: mediaError } = await supabase
      .rpc('update_media_vote_count', { 
        p_media_id: mediaId, 
        p_vote_diff: scoreDiff 
      })

    if (mediaError) throw mediaError

    return NextResponse.json({ 
      message: 'Voto registrado com sucesso',
      voteCount: media.vote_count,
      userScore: updatedUser.score
    })
  } catch (error) {
    console.error('Erro ao processar voto:', error)
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}