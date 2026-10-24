import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Health check endpoint for Cloud Run startup/liveness probes
app.get(['/healthz', '/_health', '/health'], (req, res) => {
  res.status(200).send('OK');
});

// Serve compiled static assets from dist/
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h' }));
}

// SPA fallback: send index.html for all non-asset requests
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>M737</title></head><body>جارٍ التحميل...</body></html>');
  }
});

app.listen(port, host, () => {
  console.log(`Production server running on http://${host}:${port}`);
});
