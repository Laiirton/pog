import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { Readable } from 'stream';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const username = formData.get('username') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const stream = new Readable();
    stream.push(Buffer.from(buffer));
    stream.push(null);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [process.env.FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
    });

    const { data, error } = await supabase
      .from('media')
      .insert([
        {
          title: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          src: `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`,
          thumbnail: file.type.startsWith('image/') 
            ? `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}` 
            : `https://drive.google.com/thumbnail?id=${driveResponse.data.id}`,
          username: username
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ fileId: driveResponse.data.id, supabaseData: data });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file.' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};