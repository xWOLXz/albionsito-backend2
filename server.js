// src/server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { mergePrices } from './mergePrices.js';
import logger from './utils/logger.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

// URLs de backend1 y backend2
const BACKEND1_URL = 'https://albionsito-backend.onrender.com/api/prices';
const BACKEND2_URL = 'https://albionsito-backend2.onrender.com/api/prices';

// Normaliza la respuesta simple (lista de items con ciudad, sell_price_min, buy_price_max)
function normalizeRaw(data) {
  if (!Array.isArray(data)) return [];
  return data.map(entry => ({
    item_id: entry.item_id,
    city: entry.city,
    sell_price_min: entry.sell_price_min ?? null,
    buy_price_max: entry.buy_price_max ?? null,
  }));
}

app.get('/api/combined-prices', async (req, res) => {
  const { itemId, quality = '1' } = req.query;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });

  const qNum = Number(quality);
  if (isNaN(qNum) || qNum < 1 || qNum > 5) return res.status(400).json({ error: 'quality must be 1..5' });

  logger.info(`Agregador: petición combinada para ${itemId} quality=${qNum}`);

  try {
    const [resp1, resp2] = await Promise.all([
      fetch(`${BACKEND1_URL}?itemId=${encodeURIComponent(itemId)}&quality=${qNum}`),
      fetch(`${BACKEND2_URL}?itemId=${encodeURIComponent(itemId)}&quality=${qNum}`)
    ]);

    const data1 = resp1.ok ? await resp1.json() : [];
    const data2 = resp2.ok ? await resp2.json() : [];

    const norm1 = normalizeRaw(data1);
    const norm2 = normalizeRaw(data2);

    const merged = mergePrices(norm1, norm2);

    res.json({
      meta: {
        fetchedFrom: { backend1: resp1.ok, backend2: resp2.ok },
        itemId,
        quality: qNum,
        generatedAt: new Date().toISOString()
      },
      data: merged
    });
  } catch (err) {
    logger.error('Agregador error:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Agregador escuchando en http://localhost:${PORT}`);
});
