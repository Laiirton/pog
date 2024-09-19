import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const loadTokens = () => {
  try {
    const tokens = JSON.parse(process.env.GOOGLE_DRIVE_TOKENS || '{}');
    oauth2Client.setCredentials(tokens);
  } catch (error) {
    console.error('Error loading tokens:', error);
  }
};

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  loadTokens();
  const { fileId } = params;

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const headers = new Headers();
    headers.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${response.headers['content-disposition']}"`);

    return new NextResponse(response.data, { headers });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json({ error: 'Error retrieving file' }, { status: 500 });
  }
}