import dotenv from 'dotenv';
import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import ffmpeg from 'fluent-ffmpeg';
import multer from 'multer';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
app.use(cors());
app.use(bodyParser.json());

// Rotas
app.get('/api/media', async (req, res) => {
  // Implementação da rota para buscar mídia
});

app.post('/api/upload', multer().single('file'), async (req, res) => {
  // Implementação da rota de upload
});

app.delete('/api/delete-media/:id', async (req, res) => {
  // Implementação da rota de deleção
});

// Outras rotas...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});