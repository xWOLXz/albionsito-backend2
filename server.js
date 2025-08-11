// albionsito-backend2/server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { info, error } from './utils/logger.js';
import { fetchPrices } from './fetchAlbion2D.js';
import { mergePricesData } from './mergePrices.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;

app.get('/api/init', (req, res) => res.json({ status: 'ok', msg: 'Backend2 listo' }));

// Endpoint que usa solo backend2 (actual)
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

// NUEVO endpoint que combina backend1 y backend2
app.get('/api/merged-prices', async (req, res) => {
  try {
    const { itemId, quality = '1' } = req.query;
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' });
    const q = Math.max(1, Math.min(5, Number(quality) || 1));

    // 1) Obtener datos backend2 (local)
    const backend2Data = await fetchPrices(itemId, q);

    // 2) Obtener datos backend1 vía HTTP (asumiendo backend1 en localhost:3001)
    const backend1Resp = await axios.get('http://localhost:3001/api/prices', {
      params: { itemId, quality: q }
    });
    
    // backend1 resp puede tener { prices: {...} } o { data: {...} }
    const backend1Data = backend1Resp.data.prices || backend1Resp.data.data || {};

    // 3) Combinar datos
    const merged = mergePricesData(backend1Data, backend2Data.precios);

    // 4) Adaptar salida para frontend igual que backend2.fetchPrices()
    const adapted = {};
    for (const [city, val] of Object.entries(merged)) {
      adapted[city] = {
        orden_venta: val.sell.map(s => ({ precio: s.price, fecha: s.date })),
        orden_compra: val.buy.map(b => ({ precio: b.price, fecha: b.date })),
        actualizado: val.updated
      };
    }

    res.json({ updated: new Date().toISOString(), precios: adapted });
  } catch (err) {
    error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  info(`Backend2 escuchando en http://localhost:${PORT}`);
});
