import { createRouter } from 'next/server';
import { MetadataRoute } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';

const router = createRouter();

// ... (código da rota /api/media) ...

export default router;
export const metadata: MetadataRoute = {
  runtime: 'edge',
};