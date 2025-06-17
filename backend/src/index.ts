import express from 'express';
import { createServer } from 'http';
import { Server } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

const server = createServer(app);
const wss = new Server({ server });

app.get('/', (req, res) => res.send('Stream backend running'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Simple in-memory signaling for demo
const peers: Record<string, any> = {};

wss.on('connection', ws => {
  const id = uuidv4();
  peers[id] = ws;
  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg.toString()); } catch { return; }
    if (data && data.to && peers[data.to]) {
      peers[data.to].send(JSON.stringify({ ...data, from: id }));
    }
  });

  ws.on('close', () => { delete peers[id]; });
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Backend listening on :' + (process.env.PORT || 8080));
});
