/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';

console.log('GOOGLE_DRIVE_CLIENT_ID:', process.env.GOOGLE_DRIVE_CLIENT_ID);
console.log('GOOGLE_DRIVE_REDIRECT_URI:', process.env.GOOGLE_DRIVE_REDIRECT_URI);
console.log('GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    console.log('Novo refresh token:', tokens.refresh_token);
  }
  console.log('Access token atualizado');
});

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.appfolder'
];

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

async function ensureValidToken() {
  try {
    console.log('Obtendo token válido...');
    const tokenResponse = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials(tokenResponse?.token ? { access_token: tokenResponse.token } : {});
    console.log('Token válido obtido');
  } catch (error) {
    console.error('Erro ao obter token válido:', error);
    throw error;
  }
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        console.error('Google Drive API error:', JSON.stringify(errorWithResponse.response.data, null, 2));
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
    const formUsername = formData.get('username') as string;

    console.log('Received file:', file.name, 'Size:', file.size);
    console.log('Name:', name);
    console.log('Username:', formUsername);

    if (!file || !name || !formUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    let username: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { username?: string, sid?: string };
      if (decoded.username) {
        username = decoded.username;
      } else if (decoded.sid) {
        const { data, error } = await supabase
          .from('usernames')
          .select('username')
          .eq('sid', decoded.sid)
          .single();
        
        if (error || !data) {
          throw new Error('User not found');
        }
        username = data.username;
      } else {
        throw new Error('Invalid token structure');
      }
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
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
          username: username,
          created_at: currentTimestamp,
          google_drive_link: uploadedFile.webViewLink,
          thumbnail_link: `https://drive.google.com/thumbnail?id=${uploadedFile.id}`,
        }
      ]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      return NextResponse.json({ error: 'Error saving file metadata', details: error }, { status: 500 });
    }

    console.log('Metadata saved successfully:', data);

    console.log('Updating upload count...');
    const { error: updateError } = await supabase.rpc('increment_upload_count', { username_param: username });

    if (updateError) {
      console.error('Error updating upload count:', updateError);
    } else {
      console.log('Upload count updated successfully');
    }

    return NextResponse.json({ 
      message: 'File uploaded and metadata saved successfully', 
      fileId: uploadedFile.id, 
      webViewLink: uploadedFile.webViewLink,
      username: username,
      uploadedAt: currentTimestamp
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