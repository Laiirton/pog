import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

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
    
    // Tente obter informações do arquivo antes de excluí-lo
    try {
      await drive.files.get({ fileId });
    } catch (getError) {
      console.error('Error getting file info:', getError);
      return NextResponse.json({ error: `File not found or inaccessible: ${(getError as Error).message}` }, { status: 404 });
    }

    // Deletar o arquivo do Google Drive
    await drive.files.delete({ fileId });
    console.log('File deleted from Google Drive:', fileId);

    return NextResponse.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: `Failed to delete media: ${(error as Error).message}`, details: error }, { status: 500 });
  }
}