import ffmpeg from 'fluent-ffmpeg';
import { google } from 'googleapis';
import { join } from 'path';
import fs from 'fs';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ThumbnailResult {
  thumbnailId: string;
  thumbnailUrl: string;
}

export class ThumbnailGenerator {
  // ID da pasta compartilhada no Google Drive
  private static readonly THUMBNAIL_FOLDER_ID = '11hKQ-CwN7Tcwk0Aa9vbZy2fw6di5DH5N';

  static async generateThumbnail(videoId: string): Promise<ThumbnailResult> {
    try {
      // Tentar obter a thumbnail diretamente do Google Drive
      const file = await drive.files.get({
        fileId: videoId,
        fields: 'thumbnailLink,id'
      });

      if (file.data.thumbnailLink) {
        // Modificar a URL da thumbnail para uma resolução maior
        const highResThumb = file.data.thumbnailLink.replace('=s220', '=s640');
        
        // Salvar no Supabase
        await supabase.from('video_thumbnails').upsert({
          video_id: videoId,
          thumbnail_url: highResThumb,
          created_at: new Date().toISOString()
        });

        return {
          thumbnailId: videoId,
          thumbnailUrl: highResThumb
        };
      }

      // Se não conseguir obter a thumbnail, usar a padrão
      throw new Error('Thumbnail not available');
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return {
        thumbnailId: 'default',
        thumbnailUrl: '/images/default-video-thumb.jpg'
      };
    }
  }

  private static async downloadVideo(fileId: string, outputPath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );

        const dest = fs.createWriteStream(outputPath);
        response.data
          .pipe(dest)
          .on('finish', () => resolve())
          .on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private static async createThumbnail(videoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: outputPath,
          size: '640x360'
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  private static async uploadThumbnail(
    thumbPath: string,
    videoId: string
  ): Promise<ThumbnailResult> {
    // Upload da thumbnail
    const fileMetadata = {
      name: `thumb-${videoId}.jpg`,
      parents: [this.THUMBNAIL_FOLDER_ID],
      mimeType: 'image/jpeg'
    };

    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(thumbPath)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    // Configurar permissões para acesso público
    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Obter o link direto para a imagem
    const directLink = `https://drive.google.com/uc?id=${file.data.id}`;

    return {
      thumbnailId: file.data.id!,
      thumbnailUrl: directLink
    };
  }

  private static cleanupTempFiles(paths: string[]): void {
    paths.forEach(path => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });
  }
}
