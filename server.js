// server.js - backend2

import express from 'express';
import cors from 'cors';
import logger from './utils/logger.js';
import { fetchPricesMega, updateCache } from './fetchAlbion2D.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

// Variable para cachear precios
let cachedPrices = null;
let cachedItemId = null;
let cachedQuality = null;

// Actualizar cache para un item dado
async function refreshCache(itemId, quality) {
  logger.info(`[Backend2] Actualizando cache para ${itemId} calidad ${quality}`);
  const data = await updateCache(itemId, quality);
  cachedPrices = data;
  cachedItemId = itemId;
  cachedQuality = quality;
}

// Endpoint para obtener precios
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
    // Si la cache no corresponde al item/quality actual o no existe, actualizamos
    if (cachedPrices === null || cachedItemId !== itemId || cachedQuality !== qNum) {
      await refreshCache(itemId, qNum);
    }
    // Retornamos la cache actual
    return res.json(cachedPrices);
  } catch (error) {
    logger.error(`[Backend2] Error en /api/prices: ${error.message}`);
    return res.status(500).json({ error: 'Error al obtener precios', details: error.message });
  }
});

// Ping para probar server
app.get('/api/ping', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  logger.info(`[Backend2] Servidor backend2 escuchando en http://localhost:${PORT}`);
});
