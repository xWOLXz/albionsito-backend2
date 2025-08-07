const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { fetchAlbion2DData } = require('./fetchAlbion2D');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend2 Albion2D está funcionando correctamente');
});

app.get('/api/prices2d', (req, res) => {
  fs.readFile('./data/prices2d.json', 'utf8', (err, data) => {
    if (err) {
      logger.error('Error al leer prices2d.json:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(JSON.parse(data));
  });
});

// 🔁 Llamada inicial
fetchAlbion2DData();

// 🔁 Cron job: cada 10 minutos
setInterval(() => {
  logger.info('⏰ Actualizando datos desde Albion2D...');
  fetchAlbion2DData();
}, 10 * 60 * 1000); // 10 minutos

app.listen(PORT, () => {
  logger.info(`🚀 Servidor backend2 Albion2D en puerto ${PORT}`);
});
