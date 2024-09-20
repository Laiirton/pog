import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = params.id;

  try {
    const file = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    const headers = new Headers();
    Object.entries(file.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });

    return new NextResponse(file.data as ReadableStream, {
      headers: headers,
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return new NextResponse('Error fetching file', { status: 500 });
  }
}