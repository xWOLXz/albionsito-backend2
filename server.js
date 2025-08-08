import express from 'express';
import cors from 'cors';
import { updateCache } from './fetchAlbion2D.js';
import path from 'path';
import fs from 'fs';
import logger from './utils/logger.js';

const app = express();
app.use(cors());

const DATA_FILE = path.join(process.cwd(), 'data', 'prices2d.json');

app.get('/api/prices', async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) return res.status(400).json({ error: 'Missing itemId' });

  try {
    const data = await updateCache(itemId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/init', (req, res) => {
  res.json({ status: 'ok', msg: 'MegaRecopilador Backend2 listo' });
});

app.listen(10000, () => {
  logger.info('🌐 MegaRecopilador Backend2 escuchando en puerto 10000');
});
