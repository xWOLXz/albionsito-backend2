import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import { fetchPricesMega } from './fetchAlbion2D.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

// Endpoint para obtener precios por itemId y calidad
app.get('/api/prices', async (req, res) => {
  const { itemId, quality = '1' } = req.query;

  if (!itemId) {
    return res.status(400).json({ error: 'itemId required' });
  }

  const qNum = Number(quality);
  if (isNaN(qNum) || qNum < 1 || qNum > 5) {
    return res.status(400).json({ error: 'quality must be an integer between 1 and 5' });
  }

  try {
    logger.info(`[Backend2] Petición para item ${itemId} calidad ${qNum}`);

    const data = await fetchPricesMega(itemId, qNum);

    res.json(data);
  } catch (error) {
    logger.error(`[Backend2] Error obteniendo precios: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ping para health check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Backend2 escuchando en http://localhost:${PORT}`);
});
