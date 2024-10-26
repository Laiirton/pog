/* eslint-disable @typescript-eslint/no-unused-vars */


import ffmpeg from 'fluent-ffmpeg';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Configuração do cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

interface ThumbnailResult {
  thumbnailId: string;
  thumbnailUrl: string;
}

export class ThumbnailGenerator {
  private static readonly THUMBNAIL_FOLDER_ID = process.env.GOOGLE_DRIVE_THUMBNAIL_FOLDER_ID;

  /**
   * Gera thumbnail de um vídeo do Google Drive
   */
  static async generateThumbnail(videoId: string): Promise<ThumbnailResult> {
    const tempDir = os.tmpdir();
    const tempVideoPath = join(tempDir, `video-${videoId}.mp4`);
    const tempThumbPath = join(tempDir, `thumb-${videoId}.jpg`);

    try {
      // Download do vídeo
      await this.downloadVideo(videoId, tempVideoPath);

      // Geração da thumbnail
      await this.createThumbnail(tempVideoPath, tempThumbPath);

      // Upload da thumbnail
      const thumbnailResult = await this.uploadThumbnail(tempThumbPath, videoId);

      // Limpeza dos arquivos temporários
      this.cleanupTempFiles([tempVideoPath, tempThumbPath]);

      return thumbnailResult;
    } catch (error) {
      this.cleanupTempFiles([tempVideoPath, tempThumbPath]);
      throw error;
    }
  }

  /**
   * Faz o download do vídeo do Google Drive
   */
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

  /**
   * Cria a thumbnail do vídeo usando FFmpeg
   */
  private static async createThumbnail(videoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'], // Captura frame no primeiro segundo
          filename: outputPath,
          size: '640x360' // Resolução padrão 16:9
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }

  /**
   * Faz upload da thumbnail para o Google Drive
   */
  private static async uploadThumbnail(
    thumbPath: string,
    videoId: string
  ): Promise<ThumbnailResult> {
    if (!this.THUMBNAIL_FOLDER_ID) {
        throw new Error('GOOGLE_DRIVE_THUMBNAIL_FOLDER_ID não está definido');
    }

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

    return {
      thumbnailId: file.data.id!,
      thumbnailUrl: file.data.webViewLink!
    };
  }

  /**
   * Limpa arquivos temporários
   */
  private static cleanupTempFiles(paths: string[]): void {
    paths.forEach(path => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });
  }
}
