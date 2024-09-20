import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly'
];

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    return NextResponse.redirect(authUrl);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      console.log('Novo Refresh Token:', tokens.refresh_token);
      // Salve este novo refresh token no seu arquivo .env
    }

    return NextResponse.json({ message: 'Autenticação bem-sucedida. Verifique os logs do servidor para o novo refresh token.' });
  } catch (error) {
    console.error('Erro durante a autenticação:', error);
    return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 });
  }
}