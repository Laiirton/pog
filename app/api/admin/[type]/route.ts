import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para verificar o token de admin
function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { isAdmin: boolean };
    return decoded.isAdmin;
  } catch (error) {
    return false;
  }
}

// Mapeamento de tipos para tabelas
const tableMap = {
  media: 'media_uploads',
  users: 'usernames',
  comments: 'comments',
  favorites: 'user_favorites'
} as const;

type ValidTypes = keyof typeof tableMap;

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const token = request.headers.get('admin-token');
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = params.type as ValidTypes;
    const table = tableMap[type];
    
    if (!table) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const token = request.headers.get('admin-token');
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = params.type as ValidTypes;
    const table = tableMap[type];
    
    if (!table) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
