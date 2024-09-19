import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    console.log('Starting GET request to /api/media');
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    console.log('OAuth2Client created');

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });

    console.log('Credentials set');

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log('Drive client created');

    const response = await drive.files.list({
      q: `'${process.env.FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, thumbnailLink, webViewLink)',
    });

    console.log('Drive API response received:', JSON.stringify(response.data, null, 2));

    const files = response.data.files?.map(file => ({
      id: file.id,
      title: file.name,
      type: file.mimeType?.startsWith('video/') ? 'video' : 'image',
      src: file.webViewLink,
      thumbnail: file.thumbnailLink,
      created_at: new Date().toISOString()
    })) || [];

    console.log('Processed files:', JSON.stringify(files, null, 2));

    return NextResponse.json(files);
  } catch (error: unknown) {
    console.error('Error fetching media:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Error fetching media', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Error fetching media', details: 'An unknown error occurred' }, { status: 500 });
    }
  }
}