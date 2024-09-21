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

export async function GET(request: Request) {
  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const url = new URL(request.url);
    const userToken = url.searchParams.get('userToken');

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
      .select('file_id, username, upvotes, downvotes')
      .in('file_id', files.map(file => file.id));

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      throw error;
    }

    const fileInfoMap = new Map(dbResult.map(row => [row.file_id, row]));

    // Buscar votos do usuário, se um token de usuário for fornecido
    let userVotes = {};
    if (userToken) {
      const { data: votesData, error: votesError } = await supabase
        .from('user_votes')
        .select('media_id, vote_type')
        .eq('user_token', userToken);

      if (votesError) {
        console.error('Error fetching user votes:', votesError);
      } else {
        userVotes = Object.fromEntries(votesData.map(vote => [vote.media_id, vote.vote_type]));
      }
    }

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
          upvotes: dbInfo?.upvotes || 0,
          downvotes: dbInfo?.downvotes || 0,
          user_vote: userVotes[file.id] || 0,
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