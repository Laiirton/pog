require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const stream = require('stream');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = process.env.PORT || 3001;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FOLDER_ID = process.env.FOLDER_ID;
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.use(cors());

app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync('tokens.json', JSON.stringify(tokens));
    res.send('Autenticação concluída. Você pode fechar esta janela.');
  } catch (error) {
    console.error('Erro na callback OAuth2:', error);
    res.status(500).send('Erro na autenticação.');
  }
});

let tokens = {};

const loadTokens = () => {
  try {
    tokens = JSON.parse(fs.readFileSync('tokens.json'));
    oauth2Client.setCredentials(tokens);
    console.log('Tokens carregados com sucesso.');
  } catch (error) {
    console.error('Erro ao carregar tokens:', error);
  }
};

app.get('/media', async (req, res) => {
  loadTokens();

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const files = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });

    const mediaItems = files.data.files.map((file) => ({
      id: file.id,
      title: file.name,
      type: file.mimeType.includes('video') ? 'video' : 'image',
      src: `${process.env.MEDIA_URL}/file/${file.id}`,
      thumbnail: file.mimeType.includes('video')
        ? `${process.env.MEDIA_URL}/thumbnail/${file.id}`
        : `${process.env.MEDIA_URL}/file/${file.id}`
    }));

    res.json(mediaItems);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao transmitir arquivos do Google Drive' });
  }
});

app.get('/file/:fileId', async (req, res) => {
  loadTokens();

  const { fileId } = req.params;

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const file = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    res.setHeader('Content-Type', file.headers['content-type']);
    res.setHeader('Content-Disposition', `inline; filename="${file.headers['content-disposition']}"`);

    file.data
      .on('end', () => {
        console.log('Download concluído.');
      })
      .on('error', err => {
        console.error('Erro durante o download:', err);
        res.status(500).send('Erro ao baixar o arquivo.');
      })
      .pipe(res);
  } catch (error) {
    console.error('Erro ao recuperar o arquivo:', error);
    res.status(500).send('Erro ao recuperar o arquivo.');
  }
});

app.get('/thumbnail/:fileId', async (req, res) => {
  loadTokens();

  const { fileId } = req.params;

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const file = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempFilePath = path.join(tempDir, `${fileId}.mp4`);
    const tempThumbnailPath = path.join(tempDir, `${fileId}.png`);

    const writeStream = fs.createWriteStream(tempFilePath);
    file.data.pipe(writeStream);

    writeStream.on('finish', () => {
      ffmpeg(tempFilePath)
        .screenshots({
          timestamps: ['50%'],
          filename: `${fileId}.png`,
          folder: tempDir,
          size: '320x240'
        })
        .on('end', () => {
          res.sendFile(tempThumbnailPath, (err) => {
            if (err) {
              console.error('Erro ao enviar thumbnail:', err);
              res.status(500).send('Erro ao enviar thumbnail.');
            }
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(tempThumbnailPath);
          });
        })
        .on('error', (err) => {
          console.error('Erro ao gerar thumbnail:', err);
          res.status(500).send('Erro ao gerar thumbnail.');
        });
    });

    writeStream.on('error', (err) => {
      console.error('Erro ao gravar arquivo temporário:', err);
      res.status(500).send('Erro ao processar thumbnail.');
    });
  } catch (error) {
    console.error('Erro ao processar thumbnail:', error);
    res.status(500).send('Erro ao processar thumbnail.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Acesse ${port}/auth para autenticar`);
  loadTokens(); // Carregar tokens ao iniciar o servidor
});
