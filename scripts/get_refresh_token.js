import http from 'http';
import open from 'open';
import url from 'url';
import dotenv from 'dotenv';

dotenv.config();

const port = 3001;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/oauth2callback') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('Authentication successful! You can close this window.');
    server.close();
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('Please authenticate to obtain the refresh token.');
  open(`http://localhost:3000/api/auth/google`);
});