import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // Armazene o novo refresh_token (você pode querer implementar uma forma de salvar isso de maneira segura)
    console.log('Novo refresh token:', tokens.refresh_token);
  }
  console.log('Access token atualizado');
});

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

// Definir o escopo corretamente
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly'
];

// Remova esta linha, pois não é necessária e causa o erro do linter
// oauth2Client.scope = SCOPES.join(' ');

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ensureValidToken() {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    console.log('Token atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar o token:', error);
    throw error;
  }
}

async function uploadFile(filePath: string, fileName: string, mimeType: string) {
  try {
    await ensureValidToken();
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!]
    };
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath)
    };
    console.log('Iniciando upload do arquivo:', fileName);
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, mimeType, createdTime'
    });
    console.log('Arquivo enviado com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro detalhado ao fazer upload do arquivo:', error);
    if (error.response && error.response.data && error.response.data.error) {
      console.error('Google Drive API error:', error.response.data.error);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;

    console.log('Received file:', file.name, 'Size:', file.size);
    console.log('Name:', name);
    console.log('Username:', username);

    if (!file || !name || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tempFilePath = path.join(os.tmpdir(), file.name);
    const buffer = await file.arrayBuffer();
    await fs.promises.writeFile(tempFilePath, Buffer.from(buffer));
    console.log('Arquivo temporário salvo:', tempFilePath);

    console.log('Iniciando processo de upload');
    const uploadedFile = await uploadFile(tempFilePath, name, file.type);
    console.log('Arquivo enviado para o Google Drive:', uploadedFile);

    await fs.promises.unlink(tempFilePath);
    console.log('Arquivo temporário removido');

    console.log('Saving metadata to Supabase...');
    const { data, error } = await supabase
      .from('media_uploads')
      .insert([
        {
          file_id: uploadedFile.id,
          file_name: name,
          mime_type: uploadedFile.mimeType,
          username: username,
          created_at: uploadedFile.createdTime,
          google_drive_link: uploadedFile.webViewLink,
          thumbnail_link: `https://drive.google.com/thumbnail?id=${uploadedFile.id}`,
        }
      ]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      return NextResponse.json({ error: 'Error saving file metadata' }, { status: 500 });
    }

    console.log('Updating upload count...');
    const { error: updateError } = await supabase.rpc('increment_upload_count', { username_param: username });

    if (updateError) {
      console.error('Error updating upload count:', updateError);
    }

    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      fileId: uploadedFile.id, 
      webViewLink: uploadedFile.webViewLink 
    });
  } catch (error) {
    console.error('Error in upload process:', error);
    console.error('Erro detalhado no processo de upload:', error);
    if (error.response && error.response.data && error.response.data.error) {
      console.error('Google Drive API error:', error.response.data.error);
    }
    return NextResponse.json({ error: 'Error in upload process', details: JSON.stringify(error, Object.getOwnPropertyNames(error)) }, { status: 500 });
  }
}