import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuração do Google Drive
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

// Middleware
app.use(cors({
  origin: ['https://pog-five.vercel.app', 'http://localhost:3000'],
  credentials: true,
}));
app.use(bodyParser.json());

// Rotas
app.get('/api/media', async (req: Request, res: Response) => {
  // Implementação da rota para buscar mídia
  res.json({ message: 'Rota para buscar mídia' });
});

app.post('/api/upload', multer().single('file'), async (req: Request, res: Response) => {
  // Implementação da rota de upload
  res.json({ message: 'Rota de upload' });
});

app.delete('/api/delete-media/:id', async (req: Request, res: Response) => {
  // Implementação da rota de deleção
  res.json({ message: 'Rota de deleção' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});