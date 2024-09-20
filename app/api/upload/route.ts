/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';

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
    if (error instanceof Error && 'response' in error) {
      const errorWithResponse = error as { response?: { data: unknown } };
      if (errorWithResponse.response) {
        console.error('Google Drive API error:', errorWithResponse.response.data);
      }
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const token = formData.get('username') as string; // This is actually the JWT token

    console.log('Received file:', file.name, 'Size:', file.size);
    console.log('Name:', name);
    console.log('Token:', token);

    if (!file || !name || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decode the JWT token to get the actual username
    let username: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { username: string };
      username = decoded.username;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Decoded username:', username);

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
    const currentTimestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from('media_uploads')
      .insert([
        {
          file_id: uploadedFile.id,
          file_name: name,
          mime_type: uploadedFile.mimeType,
          username: username, // Use the decoded username here
          created_at: currentTimestamp, // Usando a data e hora atual do servidor
          google_drive_link: uploadedFile.webViewLink,
          thumbnail_link: `https://drive.google.com/thumbnail?id=${uploadedFile.id}`,
        }
      ]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      // Tente obter mais detalhes sobre o erro
      if (error.details) {
        console.error('Error details:', error.details);
      }
      if (error.hint) {
        console.error('Error hint:', error.hint);
      }
      return NextResponse.json({ error: 'Error saving file metadata', details: error }, { status: 500 });
    }

    console.log('Metadata saved successfully:', data);

    console.log('Updating upload count...');
    const { error: updateError } = await supabase.rpc('increment_upload_count', { username_param: username });

    if (updateError) {
      console.error('Error updating upload count:', updateError);
      // Log mais detalhes sobre o erro, se disponíveis
      if (updateError.details) {
        console.error('Update error details:', updateError.details);
      }
      if (updateError.hint) {
        console.error('Update error hint:', updateError.hint);
      }
    } else {
      console.log('Upload count updated successfully');
    }

    return NextResponse.json({ 
      message: 'File uploaded and metadata saved successfully', 
      fileId: uploadedFile.id, 
      webViewLink: uploadedFile.webViewLink,
      username: username, // Adicionando o nome de usuário à resposta
      uploadedAt: currentTimestamp // Adicionando a data e hora do upload à resposta
    });
  } catch (error) {
    console.error('Error in upload process:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'Error in upload process', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}