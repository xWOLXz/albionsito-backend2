const fs = require('fs');
const axios = require('axios');
const path = require('path');
const logger = require('./utils/logger');

const CITIES = ['Bridgewatch', 'Martlock', 'Thetford', 'Fort Sterling', 'Lymhurst'];
const ITEM_FILE_PATH = path.join(__dirname, 'data', 'items.json');
const PRICE_FILE_PATH = path.join(__dirname, 'data', 'prices2d.json');

async function fetchPrices() {
  try {
    const itemsData = fs.readFileSync(ITEM_FILE_PATH, 'utf-8');
    const items = JSON.parse(itemsData);

    const requests = [];

    for (const item of items) {
      for (const city of CITIES) {
        const url = `https://west.albion-online-data.com/api/v2/stats/prices/${item.id}.json?locations=${city}&qualities=1`;
        requests.push(
          axios.get(url).then(res => res.data).catch(err => {
            logger.error(`Error con ${item.id} en ${city}: ${err.message}`);
            return [];
          })
        );
      }
    }

    const responses = await Promise.allSettled(requests);

    const allPrices = responses
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    fs.writeFileSync(PRICE_FILE_PATH, JSON.stringify(allPrices, null, 2));
    logger.info(`✅ Precios actualizados (${allPrices.length} registros).`);
  } catch (error) {
    logger.error(`❌ Error al obtener precios: ${error.message}`);
  }
}

module.exports = fetchPrices;
