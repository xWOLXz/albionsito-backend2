const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { fetchAlbion2D } = require('./fetchAlbion2D');
const { log } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());

const PRICES_PATH = path.join(__dirname, 'data', 'prices2d.json');

app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));
    res.json(data);
  } catch (error) {
    log(`❌ Error al leer los datos: ${error.message}`);
    res.status(500).json({ error: 'Error al leer los datos' });
  }
});

fetchAlbion2D();

cron.schedule('*/10 * * * *', () => {
  log('🔁 Actualización programada (Albion2D)...');
  fetchAlbion2D();
});

app.listen(PORT, () => {
  log(`🚀 Servidor backend2 Albion2D en puerto ${PORT}`);
});
