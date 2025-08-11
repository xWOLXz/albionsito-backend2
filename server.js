import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { info, error } from './utils/logger.js';
import { fetchPrices } from './fetchAlbion2D.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(process.cwd(), 'data', 'prices2d.json');

// Inicializar cache vacía si no existe
if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ updated: null, precios: {} }, null, 2));
}

// Endpoint salud simple
app.get('/api/init', (req, res) => {
  res.json({ status: 'ok', msg: 'Backend2 listo' });
});

// Endpoint para obtener precios
app.get('/api/prices', async (req, res) => {
  try {
    const { itemId, quality = '1' } = req.query;
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' });
    const q = Math.max(1, Math.min(5, Number(quality) || 1));

    // Intentamos obtener precios frescos
    const data = await fetchPrices(itemId, q);
    res.json(data);
  } catch (err) {
    error('API /api/prices error: ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

// Cron para refrescar precios periódicamente (puedes ajustar la frecuencia)
cron.schedule('*/15 * * * *', async () => {
  info('Cron: actualizando cache backend2 cada 15 minutos');

  try {
    const cacheRaw = fs.readFileSync(DATA_FILE, 'utf8');
    const cache = JSON.parse(cacheRaw);

    // Actualizamos cache para todos los items que ya estén en cache
    const itemIds = Object.keys(cache.precios || {});
    for (const itemId of itemIds) {
      info(`Cron fetch item: ${itemId}`);
      try {
        const data = await fetchPrices(itemId);
        cache.precios[itemId] = data.precios[itemId];
      } catch (e) {
        error(`Cron fetch error item ${itemId}: ${e.message}`);
      }
    }
    cache.updated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    error('Cron cache refresh error: ' + e.message);
  }
});

app.listen(PORT, () => {
  info(`Backend2 escuchando en http://localhost:${PORT}`);
});
