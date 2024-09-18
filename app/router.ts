import { google } from 'googleapis';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

// Função de exemplo para lidar com a rota
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // ... (código da rota /api/media) ...
  res.status(200).json({ message: 'Rota funcionando' });
};

export default handler;