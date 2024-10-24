import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.headers.get('admin-token')
    if (!verifyAdminToken(adminToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar estatísticas usando Supabase
    const [mediaCount, commentsCount, votesCount] = await Promise.all([
      supabase.from('media').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true })
    ])

    // Buscar contagem por tipo de mídia
    const { data: mediaByType } = await supabase
      .from('media')
      .select('type, count')
      .select('type, count', { count: 'exact' })
      .group('type')

    const stats = {
      totalMedia: mediaCount.count || 0,
      totalImages: mediaByType?.find(m => m.type === 'image')?.count || 0,
      totalVideos: mediaByType?.find(m => m.type === 'video')?.count || 0,
      totalComments: commentsCount.count || 0,
      totalVotes: votesCount.count || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
