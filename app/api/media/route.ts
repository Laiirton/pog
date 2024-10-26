import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { ThumbnailGenerator } from '@/lib/thumbnail-generator';

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
    let userVotes: Record<string, number> = {};
    if (userToken) {
      try {
        // Decodificar o token para obter o username
        const decoded = jwt.verify(userToken, process.env.JWT_SECRET!) as { username: string };
        const username = decoded.username;

        const { data: userData, error: userError } = await supabase
          .from('usernames')
          .select('votes')
          .eq('username', username)
          .single();

        if (userError) throw userError;
        
        if (userData && userData.votes) {
          userVotes = userData.votes;
        }
      } catch (error) {
        console.error('Error fetching user votes:', error);
        // Não retorne erro, apenas continue com userVotes vazio
      }
    }

    const mediaItems = await Promise.all(files.map(async (file) => {
      try {
        const dbInfo = fileInfoMap.get(file.id);
        
        // Gerar thumbnail para vídeos
        let thumbnailUrl = file.thumbnailLink;
        if (file.mimeType?.startsWith('video') && file.id) { // Garantir que file.id existe
          try {
            // Verificar se já existe thumbnail no banco de dados
            const { data: thumbData } = await supabase
              .from('video_thumbnails')
              .select('thumbnail_url')
              .eq('video_id', file.id)
              .single();

            if (thumbData?.thumbnail_url) {
              thumbnailUrl = thumbData.thumbnail_url;
            } else {
              // Gerar nova thumbnail apenas se tivermos um ID válido
              const { thumbnailUrl: newThumbUrl, thumbnailId } = await ThumbnailGenerator.generateThumbnail(file.id);
              
              // Salvar referência no banco de dados
              await supabase.from('video_thumbnails').insert({
                video_id: file.id,
                thumbnail_id: thumbnailId,
                thumbnail_url: newThumbUrl
              });

              thumbnailUrl = newThumbUrl;
            }
          } catch (thumbError) {
            console.error(`Error generating thumbnail for video ${file.id}:`, thumbError);
            // Usar uma thumbnail padrão em caso de erro
            thumbnailUrl = '/images/default-video-thumb.jpg';
          }
        }

        return {
          id: file.id,
          title: file.name,
          type: file.mimeType?.startsWith('video') ? 'video' : 'image',
          src: file.webViewLink,
          thumbnail: thumbnailUrl || '/images/default-video-thumb.jpg', // Fallback para thumbnail padrão
          username: dbInfo?.username || 'Unknown',
          created_at: file.createdTime,
          upvotes: dbInfo?.upvotes || 0,
          downvotes: dbInfo?.downvotes || 0,
          user_vote: file.id && userVotes[file.id] ? userVotes[file.id] : 0,
        };
      } catch (error) {
        console.error(`File ${file.id} not found or inaccessible:`, error);
        return null;
      }
    }));

    const validMediaItems = mediaItems.filter((item): item is NonNullable<typeof item> => item !== null);

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
