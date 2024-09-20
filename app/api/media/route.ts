import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('media_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mediaItems = data.map(item => ({
      id: item.file_id,
      title: item.file_name,
      type: item.mime_type.startsWith('video') ? 'video' : 'image',
      src: item.google_drive_link,
      thumbnail: item.thumbnail_link || `https://drive.google.com/thumbnail?id=${item.file_id}`,
      username: item.username,
      created_at: item.created_at,
    }));

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Error fetching media' }, { status: 500 });
  }
}