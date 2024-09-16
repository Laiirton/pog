import { createRouter } from 'next/server';

const router = createRouter();

router.push('/api/media', async (req, res) => {
  const tokens = JSON.parse(fs.readFileSync('tokens.json'));
  oauth2Client.setCredentials(tokens);

  const folderId = '152XF82cVJbZHXx35nSEOIwrELt4lGqPS';

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const files = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });

    const mediaItems = files.data.files.map((file) => ({
      id: file.id,
      title: file.name,
      type: file.mimeType.includes('video') ? 'video' : 'image',
      src: `https://drive.google.com/uc?export=view&id=${file.id}`,
    }));

    res.json(mediaItems);
  } catch (e) {
    console.error(e);
    res.status(500).send('Erro ao transmitir arquivos do Google Drive');
  }
});

export default router;