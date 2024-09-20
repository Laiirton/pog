import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    console.log('Iniciando busca de arquivos no Google Drive');
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log('Folder ID:', folderId);

    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: 'files(id, name, mimeType, createdTime, thumbnailLink)',
    });

    console.log('Resposta da API do Google Drive:', response.data);

    const files = response.data.files;
    if (!files || files.length === 0) {
      console.log('Nenhum arquivo encontrado');
      return NextResponse.json({ message: 'No files found.' }, { status: 404 });
    }

    const mediaItems = files.map(file => ({
      id: file.id,
      title: file.name,
      type: file.mimeType?.includes('video') ? 'video' : 'image',
      src: `https://drive.google.com/uc?export=view&id=${file.id}`,
      thumbnail: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.id}`,
      created_at: file.createdTime,
    }));

    console.log('Media items processados:', mediaItems);

    return NextResponse.json(mediaItems);
  } catch (error: unknown) {
    console.error('Erro detalhado ao buscar mídia do Google Drive:', error);
    if (error instanceof Error && 'response' in error) {
      const errorWithResponse = error as { response?: { data: unknown } };
      if (errorWithResponse.response) {
        console.error('Resposta de erro:', errorWithResponse.response.data);
      }
    }
    return NextResponse.json(
      { error: 'Error fetching media', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}