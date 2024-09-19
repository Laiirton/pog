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
app.use(cors({
  origin: '*', // Ajuste conforme necessário
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Rotas
app.get('/api/media', async (req, res) => {
  console.log('GET /api/media called');
  try {
    // Implementação da rota para buscar mídia
    res.status(200).json({ message: 'Media fetched successfully' });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Error fetching media' });
  }
});

app.post('/api/upload', multer().single('file'), async (req, res) => {
  console.log('POST /api/upload called');
  try {
    console.log('File:', req.file);
    console.log('Body:', req.body);
    // Implementação da rota de upload
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.delete('/api/delete-media/:id', async (req, res) => {
  console.log('DELETE /api/delete-media/:id called');
  try {
    // Implementação da rota de deleção
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Error deleting media' });
  }
});

// Outras rotas...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});