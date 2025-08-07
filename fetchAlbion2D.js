const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('./utils/logger');

const ITEMS_PATH = path.join(__dirname, 'data', 'items.json');
const OUTPUT_PATH = path.join(__dirname, 'data', 'prices2d.json');

const CITIES = ['Bridgewatch', 'Martlock', 'Fort Sterling', 'Thetford', 'Lymhurst', 'Brecilien', 'Caerleon'];

async function fetchAlbion2D() {
  try {
    const items = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
    const allData = [];

    for (const item of items) {
      const url = `https://api.albion2d.com/api/v1/stats/prices/${item}?locations=${CITIES.join(',')}&qualities=1`;
      log(`Consultando API Albion2D: ${item}`);
      const response = await axios.get(url);
      allData.push(...response.data);
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
    log(`✅ Precios Albion2D actualizados: ${allData.length} registros`);
  } catch (error) {
    log(`❌ Error al consultar API Albion2D: ${error.message}`);
  }
}

module.exports = { fetchAlbion2D };
