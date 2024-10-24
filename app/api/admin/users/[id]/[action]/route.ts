import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        const { error: banError } = await supabase
          .from('users')
          .update({ status: 'banned' })
          .eq('id', id)
        if (banError) throw banError
        break
      
      case 'unban':
        const { error: unbanError } = await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', id)
        if (unbanError) throw unbanError
        break
      
      case 'delete':
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', id)
        if (deleteError) throw deleteError
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
