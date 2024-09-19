require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const multer = require('multer');
const { Readable } = require('stream'); 
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
const port = process.env.PORT || 30010;

// Update scopes to include write permissions
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FOLDER_ID = process.env.FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.use(cors());
app.use(bodyParser.json());

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
    res.send('Authentication completed. You can close this window.');
  } catch (error) {
    console.error('Error in OAuth2 callback:', error);
    res.status(500).send('Authentication error.');
  }
});

let tokens = {};

const loadTokens = () => {
  try {
    tokens = JSON.parse(fs.readFileSync('tokens.json'));
    oauth2Client.setCredentials(tokens);
    console.log('Tokens loaded successfully.');
  } catch (error) {
    console.error('Error loading tokens:', error);
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
    res.status(500).json({ error: 'Error transmitting files from Google Drive' });
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
        console.log('Download completed.');
      })
      .on('error', err => {
        console.error('Error during download:', err);
        res.status(500).send('Error downloading file.');
      })
      .pipe(res);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).send('Error retrieving file.');
  }
});

// Endpoint for generating thumbnails
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
              res.status(500).send('Error sending thumbnail.');
            }
            fs.unlinkSync(tempFilePath);
            fs.unlinkSync(tempThumbnailPath);
          });
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          res.status(500).send('Error generating thumbnail.');
        });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing temporary file:', err);
      res.status(500).send('Error processing thumbnail.');
    });
  } catch (error) {
    console.error('Error processing thumbnail:', error);
    res.status(500).send('Error processing thumbnail.');
  }
});

// New endpoint for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
  loadTokens();

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  const fileMetadata = {
    name: req.body.name || req.file.originalname,
    parents: [FOLDER_ID],
  };
  
  const media = {
    mimeType: req.file.mimetype,
    body: Readable.from(req.file.buffer),
  };
  
  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log('File uploaded successfully to Google Drive. ID:', file.data.id);

    // Save information to Supabase
    const { data, error } = await supabase
      .from('media')
      .insert([
        {
          title: req.body.name || req.file.originalname,
          type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
          src: `${process.env.MEDIA_URL}/file/${file.data.id}`,
          thumbnail: req.file.mimetype.startsWith('image/') ? `${process.env.MEDIA_URL}/file/${file.data.id}` : `${process.env.MEDIA_URL}/thumbnail/${file.data.id}`,
          username: req.body.username
        }
      ])
      .select();

    if (error) {
      console.error('Error saving to Supabase:', error);
      return res.status(500).json({ error: 'Error saving data to the database.' });
    }

    // Incrementar a contagem de uploads do usuário
    const { data: updatedUser, error: updateError } = await supabase
      .rpc('increment_upload_count', { username_param: req.body.username })
      .single();

    if (updateError) {
      console.error('Error updating upload count:', updateError);
    } else {
      console.log('Updated user:', updatedUser);
    }

    res.status(200).json({ fileId: file.data.id, supabaseData: data });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file.' });
  }
});

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Add this function at the top of the file, along with other helper functions
const verifyAdminToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.isAdmin === true;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return false;
  }
};

// Add this new endpoint to delete media
app.delete('/delete-media/:id', async (req, res) => {
  console.log('Delete request received for id:', req.params.id);
  const adminToken = req.headers['admin-token'];
  console.log('Admin token:', adminToken);
  if (!verifyAdminToken(adminToken)) {
    console.log('Admin token verification failed');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    // Delete from Google Drive
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.files.delete({ fileId: id });
    console.log('File deleted from Google Drive:', id);

    // No longer deleting from Supabase, just updating the status
    const { data, error } = await supabase
      .from('media')
      .update({ status: 'deleted' })
      .eq('src', `${process.env.MEDIA_URL}/file/${id}`);

    if (error) {
      console.warn('Failed to update Supabase record:', error);
      // Continue even if Supabase update fails
    }

    console.log('Media deleted successfully');
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: `Failed to delete media: ${error.message}` });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('usernames')
      .select()
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Criptografar a senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Inserir novo usuário com a senha criptografada
    const { data: newUser, error } = await supabase
      .from('usernames')
      .insert({ username, password: hashedPassword, upload_count: 0 })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ message: 'User registered successfully', user: { username: newUser.username } });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'An error occurred while registering the user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('usernames')
      .select()
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verificar a senha criptografada
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ message: 'Login successful', user: { username: user.username } });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'An error occurred while logging in' });
  }
});

// Adicione esta nova rota para obter o ranking
app.get('/user-ranking', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usernames')
      .select('username, upload_count')
      .order('upload_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('User ranking data:', data); // Log para debug

    res.json(data);
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    res.status(500).json({ error: 'An error occurred while fetching the user ranking' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Access http://localhost:${port}/auth to authenticate`);
  loadTokens(); // Load tokens when starting the server
});
