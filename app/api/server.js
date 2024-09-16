require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const stream = require('stream');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = 3001;

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
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync('tokens.json', JSON.stringify(tokens));
  res.send('Autenticação concluída. Você pode fechar esta janela.');
});

const loadTokens = () => {
  try {
    const tokens = JSON.parse(fs.readFileSync('tokens.json'));
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
      src: `http://localhost:3001/file/${file.id}`,
      thumbnail: file.mimeType.includes('video')
        ? `http://localhost:3001/thumbnail/${file.id}`
        : `http://localhost:3001/file/${file.id}`
    }));

    res.json(mediaItems);
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao transmitir arquivos do Google Drive');
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
        console.log('Done');
      })
      .on('error', err => {
        console.error('Error during download', err);
        res.status(500).send('Error downloading file');
      })
      .pipe(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error retrieving file');
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
              console.error('Error sending thumbnail:', err);
              res.status(500).send('Error sending thumbnail');
            }
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(tempThumbnailPath);
          });
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          res.status(500).send('Error generating thumbnail');
        });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error retrieving file');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('Acesse http://localhost:3001/auth para autenticar');
  loadTokens(); // Carregar tokens ao iniciar o servidor
});
