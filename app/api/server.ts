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
// ... resto do código ...

// Corrigir o erro de variável não utilizada
app.delete('/delete-media/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data: updateData, error: updateError } = await supabase
      .from('media')
      .update({ status: 'deleted' })
      .eq('src', `${process.env.MEDIA_URL}/file/${id}`);

    if (updateError) {
      console.warn('Failed to update Supabase record:', updateError);
      return res.status(500).json({ error: 'Failed to update database record' });
    }

    // ... resto do código de deleção ...

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ... resto do código ...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});