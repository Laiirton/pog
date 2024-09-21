import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Inicialize o cliente do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

export async function GET() {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, createdTime, webViewLink, thumbnailLink)',
    });

    const files = response.data.files;

    if (!files || files.length === 0) {
      return NextResponse.json([]);
    }

    // Buscar informações adicionais do banco de dados usando Supabase
    const { data: dbResult, error } = await supabase
      .from('media_uploads')
      .select('file_id, username, vote_count')
      .in('file_id', files.map(file => file.id));

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      throw error;
    }

    const fileInfoMap = new Map(dbResult.map(row => [row.file_id, row]));

    const mediaItems = await Promise.all(files.map(async (file) => {
      try {
        await drive.files.get({ fileId: file.id as string });
        const dbInfo = fileInfoMap.get(file.id);
        return {
          id: file.id,
          title: file.name,
          type: file.mimeType?.startsWith('video') ? 'video' : 'image',
          src: file.webViewLink,
          thumbnail: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}`,
          username: dbInfo?.username || 'Unknown',
          created_at: file.createdTime,
          vote_count: dbInfo?.vote_count || 0,
        };
      } catch (error) {
        console.error(`File ${file.id} not found or inaccessible`);
        return null;
      }
    }));

    const validMediaItems = mediaItems.filter(item => item !== null);

    return NextResponse.json(validMediaItems, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Error fetching media' }, { status: 500 });
  }
}