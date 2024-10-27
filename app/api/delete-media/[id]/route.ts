/* eslint-disable @typescript-eslint/no-unused-vars */


import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const adminToken = req.headers.get('admin-token');
  
  if (!adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as { isAdmin: boolean };
    if (!decoded.isAdmin) {
      throw new Error('Not an admin');
    }
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id: fileId } = params;

  try {
    // Primeiro, verificar se a mídia existe no banco de dados
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_uploads')
      .select('id')
      .eq('file_id', fileId)
      .single();

    if (mediaError) {
      console.error('Error fetching media data:', mediaError);
      return NextResponse.json({ error: 'Media not found in database' }, { status: 404 });
    }

    const mediaId = mediaData.id;

    // 1. Deletar registros relacionados
    // Deletar comentários
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('media_id', mediaId);

    if (commentsError) {
      console.error('Error deleting comments:', commentsError);
    }

    // Deletar favoritos
    const { error: favoritesError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('media_id', mediaId);

    if (favoritesError) {
      console.error('Error deleting favorites:', favoritesError);
    }

    // Atualizar votos dos usuários
    const { data: users, error: usersError } = await supabase
      .from('usernames')
      .select('id, votes');

    if (!usersError && users) {
      for (const user of users) {
        if (user.votes && user.votes[mediaId]) {
          const newVotes = { ...user.votes };
          delete newVotes[mediaId];
          await supabase
            .from('usernames')
            .update({ votes: newVotes })
            .eq('id', user.id);
        }
      }
    }

    // 2. Deletar o arquivo do Google Drive
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    try {
      await drive.files.delete({ fileId });
      console.log('File deleted from Google Drive:', fileId);
    } catch (driveError) {
      console.error('Error deleting from Google Drive:', driveError);
      // Se o arquivo não existir no Drive, continuamos com a deleção do banco
      if ((driveError as { code?: number }).code !== 404) {
        console.warn('File not found in Drive or already deleted');
      }
    }

    // 3. Finalmente, deletar o registro principal da mídia
    const { error: deleteError } = await supabase
      .from('media_uploads')
      .delete()
      .eq('file_id', fileId);

    if (deleteError) {
      console.error('Error deleting media record:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ 
      message: 'Media and related records deleted successfully',
      mediaId: mediaId,
      fileId: fileId
    });

  } catch (error) {
    console.error('Error in delete operation:', error);
    return NextResponse.json({ 
      error: `Failed to delete media: ${(error as Error).message}`, 
      details: error 
    }, { status: 500 });
  }
}
