import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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

    const mediaItems = await Promise.all(files.map(async (file) => {
      try {
        // Verifica se o arquivo ainda existe
        await drive.files.get({ fileId: file.id as string });
        return {
          id: file.id,
          title: file.name,
          type: file.mimeType?.startsWith('video') ? 'video' : 'image',
          src: file.webViewLink,
          thumbnail: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}`,
          username: 'Unknown',
          created_at: file.createdTime,
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