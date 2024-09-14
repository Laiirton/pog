import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const galleryDir = path.join(process.cwd(), 'public', 'gallery');
    const files = fs.readdirSync(galleryDir);

    const galleryItems = files.map(file => {
        const extension = path.extname(file).toLowerCase();
        const type = ['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(extension) ? 'image' : 'video';
        return {
            type,
            src: `/gallery/${file}`,
            alt: path.basename(file, extension)
        };
    });

    return NextResponse.json(galleryItems);
}