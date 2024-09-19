import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

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

    return new Promise((resolve, reject) => {
      ffmpeg(Readable.from(response.data))
        .screenshots({
          timestamps: ['50%'],
          filename: 'thumbnail.png',
          folder: '/tmp',
        })
        .on('end', () => {
          const fs = require('fs');
          const thumbnailStream = fs.createReadStream('/tmp/thumbnail.png');
          const headers = new Headers();
          headers.set('Content-Type', 'image/png');
          resolve(new NextResponse(thumbnailStream, { headers }));
        })
        .on('error', (err: any) => {
          console.error('Error generating thumbnail:', err);
          reject(NextResponse.json({ error: 'Error generating thumbnail' }, { status: 500 }));
        });
    });
  } catch (error) {
    console.error('Error retrieving file for thumbnail:', error);
    return NextResponse.json({ error: 'Error retrieving file for thumbnail' }, { status: 500 });
  }
}