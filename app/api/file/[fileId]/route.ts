import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const file = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    const headers = new Headers();
    headers.set('Content-Type', file.headers['content-type']);
    headers.set('Content-Disposition', `attachment; filename="${file.headers['content-disposition']}"`);

    return new NextResponse(file.data, { headers });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Error fetching file' }, { status: 500 });
  }
}