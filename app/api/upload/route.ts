import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { authorize } from '../media/route'; // Reuse the authorize function

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: file.name,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.type,
      body: file.stream(),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    return NextResponse.json({ fileId: response.data.id });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};