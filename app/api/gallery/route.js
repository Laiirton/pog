import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';

const galleryDir = path.join(process.cwd(), 'public', 'gallery');
const thumbnailsDir = path.join(process.cwd(), 'public', 'thumbnails');

// Certifique-se de que o diretório de miniaturas existe
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

async function generateThumbnail(videoPath, videoName) {
	const thumbnailName = `thumbnail-${videoName}.png`;
	const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
	
	return new Promise((resolve, reject) => {
		ffmpeg(videoPath)
			.screenshots({
				timestamps: ['00:00:01'],
				filename: thumbnailName,
				folder: thumbnailsDir,
				size: '320x240'
			})
			.on('end', () => {
				const thumbnailUrl = `/thumbnails/${thumbnailName}`;
				console.log('Thumbnail generated:', thumbnailUrl);
				resolve(thumbnailUrl);
			})
			.on('error', (err) => {
				console.error('Error generating thumbnail:', err);
				reject(err);
			});
	});
}

export async function GET() {
	const files = fs.readdirSync(galleryDir);
	console.log('Files in gallery:', files);

	const galleryItems = await Promise.all(files.map(async (file) => {
		const filePath = path.join(galleryDir, file);
		const extension = path.extname(file).toLowerCase();
		const isVideo = ['.mp4', '.webm', '.ogg'].includes(extension);
		
		let thumbnail = null;
		if (isVideo) {
			try {
				thumbnail = await generateThumbnail(filePath, path.basename(file, extension));
				console.log(`Thumbnail for ${file}:`, thumbnail);
			} catch (error) {
				console.error(`Failed to generate thumbnail for ${file}:`, error);
			}
		}

		return {
			type: isVideo ? 'video' : 'image',
			src: `/gallery/${file}`,
			alt: path.basename(file, extension),
			thumbnail: isVideo ? thumbnail : null
		};
	}));

	console.log('Files in thumbnails after processing:', fs.readdirSync(thumbnailsDir));

	console.log('Gallery items:', galleryItems);
	return NextResponse.json(galleryItems);
}