import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

// Define os escopos de acesso necessários para a API do Google Drive
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly'
];

// Cria uma instância do cliente OAuth2 com as credenciais do Google Drive
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

export async function GET(request: Request) {
  // Extrai o código de autorização da URL da requisição
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // Se não houver código, redireciona para a URL de autenticação
  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    return NextResponse.redirect(authUrl);
  }

  try {
    // Troca o código de autorização por tokens de acesso
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Se um novo refresh token for recebido, registra no console
    if (tokens.refresh_token) {
      console.log('Novo Refresh Token:', tokens.refresh_token);
      // Salve este novo refresh token no seu arquivo .env
    }

    // Retorna uma resposta de sucesso
    return NextResponse.json({ message: 'Autenticação bem-sucedida. Verifique os logs do servidor para o novo refresh token.' });
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Erro durante a autenticação:', error);
    return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 });
  }
}