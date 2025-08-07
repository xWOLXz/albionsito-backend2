// albionsito-backend2/server.js

const express = require('express');
const cors = require('cors');
const { fetchPrices } = require('./fetchAlbion2D');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());

app.get('/api/prices', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'prices2d.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.json(data);
    } else {
      res.status(404).json({ error: 'Archivo de precios no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo los datos' });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Servidor backend2 Albion2D en puerto ${PORT}`);
  await fetchPrices(); // Consultar precios al arrancar
});
