import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';

export async function GET() {
  try {
    console.log('Starting GET request to /api/media');

    const auth = await authorize();
    const files = await listFiles(auth);

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

async function authorize() {
  const content = await fs.promises.readFile(CREDENTIALS_PATH, 'utf8');
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fs.promises.readFile(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    throw new Error('Token not found. Please run the authentication script separately.');
  }

  return oAuth2Client;
}

async function listFiles(auth: any) {
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, thumbnailLink, webViewLink, createdTime)',
  });

  const files = res.data.files?.map(file => ({
    id: file.id,
    title: file.name,
    type: file.mimeType?.startsWith('video/') ? 'video' : 'image',
    src: file.webViewLink,
    thumbnail: file.thumbnailLink,
    created_at: file.createdTime
  })) || [];

  return files;
}