/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// Marcar a rota como dinâmica
export const dynamic = 'force-dynamic';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // Se for um caminho local (começando com /)
    if (url.startsWith('/')) {
      const publicDir = path.join(process.cwd(), 'public');
      const filePath = path.join(publicDir, url);

      // Verificar se o arquivo existe e está dentro do diretório public
      if (!filePath.startsWith(publicDir)) {
        throw new Error('Invalid path');
      }

      try {
        const fileBuffer = await fs.promises.readFile(filePath);
        const headers = new Headers();
        headers.set('Content-Type', 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(fileBuffer, { headers });
      } catch (error) {
        console.error('Error reading local file:', error);
        throw new Error('File not found');
      }
    }
    
    // Se for uma URL do Google Drive
    if (url.includes('drive.google.com')) {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const fileId = url.match(/id=([^&]+)/)?.[1];
      
      if (!fileId) {
        throw new Error('Invalid Google Drive URL');
      }

      const response = await drive.files.get({
        fileId,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      const headers = new Headers();
      headers.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      // Converter stream para blob
      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }
      const blob = new Blob(chunks, { type: response.headers['content-type'] });

      return new NextResponse(blob, { headers });
    } else {
      // Para URLs externas
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new NextResponse(blob, { headers });
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    
    // Tentar usar uma imagem de fallback em caso de erro
    try {
      const fallbackPath = path.join(process.cwd(), 'public', 'images', 'error-thumb.jpg');
      const fallbackBuffer = await fs.promises.readFile(fallbackPath);
      const headers = new Headers();
      headers.set('Content-Type', 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new NextResponse(fallbackBuffer, { headers });
    } catch (fallbackError) {
      return NextResponse.json({ 
        error: 'Failed to fetch image', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}
