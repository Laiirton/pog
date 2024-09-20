import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

// Configuração do cliente OAuth2 para autenticação com o Google Drive
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

// Configuração das credenciais usando o refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
});

// Inicialização da API do Google Drive
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Função para lidar com requisições GET
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = params.id;

  try {
    // Busca o arquivo no Google Drive
    const file = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    // Cria um objeto Headers com os cabeçalhos da resposta do Google Drive
    const headers = new Headers();
    Object.entries(file.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });

    // Converte o Readable do Node.js para um ReadableStream da Web
    const readable = file.data as Readable;
    const stream = new ReadableStream({
      start(controller) {
        readable.on('data', (chunk) => controller.enqueue(chunk));
        readable.on('end', () => controller.close());
        readable.on('error', (err) => controller.error(err));
      },
    });

    // Retorna a resposta com o stream do arquivo e os cabeçalhos
    return new NextResponse(stream, {
      headers: headers,
    });
  } catch (error) {
    // Em caso de erro, registra o erro e retorna uma resposta de erro
    console.error('Error fetching file:', error);
    return new NextResponse('Error fetching file', { status: 500 });
  }
}