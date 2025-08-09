const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { refreshCache, OUTPUT } = require('./fetchAlbion2D');
const { log } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());

const ITEMS_PATH = path.join(__dirname, 'data', 'items.json');

app.get('/', (req, res) => {
  res.send('✅ Backend2 Albion Online API está funcionando');
});

app.get('/api/update', async (req, res) => {
  try {
    const itemsRaw = fs.readFileSync(ITEMS_PATH, 'utf-8');
    const items = JSON.parse(itemsRaw);
    await refreshCache(items);
    res.json({ ok: true, updated: new Date().toISOString() });
  } catch (err) {
    log('[Backend2] Error actualizando precios:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/prices', (req, res) => {
  try {
    const data = fs.readFileSync(OUTPUT, 'utf-8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (err) {
    log('[Backend2] Error leyendo precios:', err.message || err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  log(`🌐 Backend2 escuchando en http://localhost:${PORT}`);
});
