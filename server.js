const express = require('express');
const fs = require('fs');
const cors = require('cors');
const fetch = require('node-fetch');
const logger = require('./utils/logger');
const mergePrices = require('./mergePrices');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3002;
const BACKEND1_URL = 'http://localhost:3001/api/prices';

// Leer cache local de backend2
function getLocalPrices() {
    const rawData = fs.readFileSync('./data/prices2d.json', 'utf8');
    return JSON.parse(rawData);
}

app.get('/api/prices', async (req, res) => {
    try {
        logger.info('Obteniendo precios desde backend1 y backend2...');

        // 1️⃣ Backend2 cache local
        const backend2Data = getLocalPrices();

        // 2️⃣ Backend1 API
        let backend1Data = [];
        try {
            const resp1 = await fetch(BACKEND1_URL);
            backend1Data = await resp1.json();
        } catch (err) {
            logger.error('No se pudo obtener datos de backend1:', err.message);
        }

        // 3️⃣ Combinar
        const mergedData = mergePrices(backend1Data, backend2Data);

        res.json(mergedData);
    } catch (err) {
        logger.error('Error al obtener precios combinados:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    logger.info(`Backend2 combinado escuchando en http://localhost:${PORT}`);
});
