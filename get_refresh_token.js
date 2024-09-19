import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import open from 'open';
import destroyer from 'server-destroy';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.readonly'
];

async function getRefreshToken() {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      prompt: 'consent'  // Add this line
    });

    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new URL(req.url, 'http://localhost:3001')
              .searchParams;
            const code = qs.get('code');
            console.log(`Code is ${code}`);
            res.end('Authentication successful! Please return to the console.');
            server.destroy();

            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            console.log('Refresh token:', tokens.refresh_token);
            resolve(tokens.refresh_token);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3001, () => {
        open(authorizeUrl, { wait: false }).then(cp => cp.unref());
      });
    destroyer(server);
  });
}

getRefreshToken();