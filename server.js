import express from 'express';
import cors from 'cors';
import path from 'path';
import { info, error } from './utils/logger.js';
import { fetchPrices } from './fetchAlbion2D.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

app.get('/api/init', (req, res) => res.json({ status: 'ok', msg: 'Backend2 listo' }));

app.get('/api/prices', async (req, res) => {
  try {
    const { itemId, quality = '1' } = req.query;
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' });
    const q = Math.max(1, Math.min(5, Number(quality) || 1));
    const data = await fetchPrices(itemId, q);
    res.json(data);
  } catch (err) {
    error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => info(`Backend2 escuchando en http://localhost:${PORT}`));
