import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const adminToken = req.headers.get('admin-token')
    if (!verifyAdminToken(adminToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, action } = params

    switch (action) {
      case 'ban':
        await prisma.user.update({
          where: { id },
          data: { status: 'banned' }
        })
        break
      
      case 'unban':
        await prisma.user.update({
          where: { id },
          data: { status: 'active' }
        })
        break
      
      case 'delete':
        await prisma.user.delete({
          where: { id }
        })
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error performing user action:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
