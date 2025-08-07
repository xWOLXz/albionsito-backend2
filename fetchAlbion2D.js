// albionsito-backend2/fetchAlbion2D.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');
const { log } = require('./utils/logger');

const ITEMS_PATH = path.join(__dirname, 'data', 'items.json');
const OUTPUT_PATH = path.join(__dirname, 'data', 'prices2d.json');

// Limitamos la cantidad de peticiones en paralelo (por ejemplo 5)
const limit = pLimit(5);

// Pausa entre lotes
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchPrices() {
  try {
    const items = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf-8'));
    const cities = ['Bridgewatch', 'Martlock', 'Lymhurst', 'Thetford', 'Fort Sterling', 'Caerleon'];
    const results = [];

    const tasks = [];

    for (const item of items) {
      for (const city of cities) {
        // Cada tarea se limita con p-limit
        const task = limit(async () => {
          const url = `https://west.albion-online-data.com/api/v2/stats/prices/${item.id}.json?locations=${city}&qualities=1`;
          try {
            const response = await axios.get(url);
            log(`✅ [${item.name}] en ${city} consultado con éxito.`);
            results.push(...response.data);
          } catch (error) {
            log(`❌ Error consultando ${item.name} en ${city}: ${error.response?.status || error.message}`);
          }
          await delay(150); // Esperamos 150ms entre peticiones para evitar 429
        });

        tasks.push(task());
      }
    }

    await Promise.all(tasks);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    log(`✅ Precios guardados en prices2d.json`);
  } catch (err) {
    log(`❌ Error general en fetchPrices: ${err.message}`);
  }
}

module.exports = { fetchPrices };
