/* eslint-disable @typescript-eslint/no-unused-vars */

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

// Definição das credenciais do cliente OAuth2 com o refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
});

// Inicialização do cliente do Google Drive
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Função para lidar com requisições GET
export async function GET(request: NextRequest) {
  // Extrai os parâmetros da URL
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Verifica se o ID do arquivo foi fornecido
  if (!id) {
    return new NextResponse('Missing file ID', { status: 400 });
  }

  try {
    // Faz uma requisição para obter o arquivo do Google Drive
    const response = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'stream' }
    );

    // Cria um objeto Headers com os cabeçalhos da resposta do Google Drive
    const headers = new Headers();
    Object.entries(response.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });

    // Converte o Readable para ReadableStream
    const readable = response.data as Readable;
    const stream = new ReadableStream({
      start(controller) {
        readable.on('data', (chunk) => controller.enqueue(chunk));
        readable.on('end', () => controller.close());
        readable.on('error', (err) => controller.error(err));
      },
    });

    // Retorna a imagem como um stream com os cabeçalhos apropriados
    return new NextResponse(stream, { headers });
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Error fetching image:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}