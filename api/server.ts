import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['https://pog-five.vercel.app', 'http://localhost:3000'],
  credentials: true,
}));

app.get('/media', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express!' });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});