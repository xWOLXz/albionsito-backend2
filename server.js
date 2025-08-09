const express = require('express');
const fs = require('fs');
const path = require('path');
const fetchPrices = require('./fetchAlbion2D');
const logger = require('./utils/logger');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

const PRICES_PATH = path.join(__dirname, 'data', 'prices2d.json');
const ITEMS_PATH = path.join(__dirname, 'data', 'items.json');

app.get('/api/prices', (req, res) => {
  if (fs.existsSync(PRICES_PATH)) {
    const prices = JSON.parse(fs.readFileSync(PRICES_PATH));
    res.json(prices);
  } else {
    res.status(404).json({ error: 'Archivo de precios no encontrado.' });
  }
});

app.get('/api/items', (req, res) => {
  if (fs.existsSync(ITEMS_PATH)) {
    const items = JSON.parse(fs.readFileSync(ITEMS_PATH));
    res.json(items);
  } else {
    res.status(404).json({ error: 'Archivo de items no encontrado.' });
  }
});

// Tarea programada: cada 10 minutos
cron.schedule('*/10 * * * *', async () => {
  logger.info('⏰ Ejecutando tarea programada de actualización...');
  await fetchPrices();
});

app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en el puerto ${PORT}`);
  fetchPrices(); // Ejecutar una vez al iniciar
});
