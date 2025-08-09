// server.js
import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import { fetchPricesMega } from './fetchAlbion2D.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

// Cache simple en memoria
let cachedData = null;
let cachedItemId = null;
let cachedQuality = null;
let cachedAt = null;

// Actualiza cache de precios
async function updateCache(itemId, quality) {
  logger.info(`[Backend2] Actualizando cache para ${itemId} calidad ${quality}`);
  const data = await fetchPricesMega(itemId, quality);
  cachedData = data;
  cachedItemId = itemId;
  cachedQuality = quality;
  cachedAt = new Date();
  return data;
}

app.get('/api/prices', async (req, res) => {
  const { itemId, quality = '1' } = req.query;
  if (!itemId) {
    return res.status(400).json({ error: 'itemId es requerido' });
  }
  const qNum = Number(quality);
  if (isNaN(qNum) || qNum < 1 || qNum > 5) {
    return res.status(400).json({ error: 'quality debe ser un número entre 1 y 5' });
  }

  try {
    // Si cache no existe o es para otro item o calidad, actualizamos
    if (!cachedData || cachedItemId !== itemId || cachedQuality !== qNum) {
      await updateCache(itemId, qNum);
    }

    res.json(cachedData);
  } catch (error) {
    logger.error(`[Backend2] Error en /api/prices: ${error.message}`);
    res.status(500).json({ error: 'Error al obtener precios', details: error.message });
  }
});

// Ping simple para salud del server
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`[Backend2] Servidor backend2 escuchando en http://localhost:${PORT}`);
});
