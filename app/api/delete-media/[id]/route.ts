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
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Deletar o arquivo do Google Drive
    try {
      await drive.files.delete({ fileId });
      console.log('File deleted from Google Drive:', fileId);
    } catch (driveError) {
      console.error('Error deleting from Google Drive:', driveError);
      // Se o arquivo não existir no Drive, continuamos com a deleção do banco
      if ((driveError as any).code !== 404) {
        throw driveError;
      }
    }

    return NextResponse.json({ message: 'Media deleted successfully from Google Drive' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ 
      error: `Failed to delete media: ${(error as Error).message}`, 
      details: error 
    }, { status: 500 });
  }
}
