import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verificar token de admin
    const adminToken = req.headers.get('admin-token')
    if (!verifyAdminToken(adminToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar estatísticas
    const [
      totalMedia,
      totalComments,
      totalVotes
    ] = await Promise.all([
      prisma.media.count(),
      prisma.comment.count(),
      prisma.vote.count()
    ])

    // Buscar contagem por tipo de mídia
    const mediaByType = await prisma.media.groupBy({
      by: ['type'],
      _count: true
    })

    const stats = {
      totalMedia,
      totalImages: mediaByType.find(m => m.type === 'image')?._count || 0,
      totalVideos: mediaByType.find(m => m.type === 'video')?._count || 0,
      totalComments,
      totalVotes
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
