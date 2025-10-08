import { deepSeekPrompt } from './deepseek.js';
import express from 'express';
import path from 'path';

const lastResponse = [];
const app = express();

app.use(express.json({ strict: false }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

const withContext = (data) =>
  lastResponse.length > 0 ? `${data.toString()} | context: ${lastResponse.join(', ')}` : data.toString();

app.use(express.static(process.cwd()));

app.get('/', function(_req, res) {
  const indexPath = path.join(process.cwd(), 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('sendFile error for', indexPath, err);
      
      res.status(err?.status || 500).send('Internal Server Error');
    }
  });
});

app.post('/search', async (req, res) => {
  try {
    let userMessage = '';
    if (typeof req.body === 'string') {
      userMessage = req.body;
    } else if (req.body && typeof req.body === 'object' && 'message' in req.body) {
      userMessage = req.body.message;
    } else {
      userMessage = JSON.stringify(req.body);
    }

    const response = await deepSeekPrompt(withContext(userMessage), 1, '');
    res.send(response);
  } catch (err) {
    res.status(500).send(`❌ Error: ${err?.message ?? String(err)}`);
  }
});

app.post('/analyze', async (req, res) => {
  try {
    const body = req.body;
    const userMessage = Array.isArray(body) ? body[0] : body?.message ?? body;
    const sources = Array.isArray(body) ? body[1] : body?.sources ?? '';
    const response = await deepSeekPrompt(withContext(userMessage), 2, sources);
    res.send(response);
  } catch (err) {
    res.status(500).send(`❌ Error: ${err?.message ?? String(err)}`);
  }
});

app.post('/final', async (req, res) => {
  try {
    const body = req.body;
    const userMessage = Array.isArray(body) ? body[0] : body?.message ?? body;
    const analyze = Array.isArray(body) ? body[1] : body?.analyze ?? '';
    const response = await deepSeekPrompt(withContext(userMessage), 3, analyze);

    if (lastResponse.length === 3) lastResponse.shift();
    lastResponse.push(response?.toString() ?? '');

    res.send(response);
  } catch (err) {
    res.status(500).send(`❌ Error: ${err?.message ?? String(err)}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Jacek is running on port ${PORT}`);
});