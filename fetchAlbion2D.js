const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('./utils/logger');

const OUTPUT = path.join(__dirname, 'data', 'prices2d.json');
const LOCATIONS = ['Caerleon','Bridgewatch','Lymhurst','Martlock','Thetford','Fort Sterling','Brecilien'];

async function fetchFromAlternative(itemId, quality = 1) {
  try {
    const url = `https://west.albion-online-data.com/api/v2/stats/market/${encodeURIComponent(itemId)}.json?locations=${LOCATIONS.join(',')}&qualities=${quality}`;
    log(`[Backend2] GET ${url}`);
    const r = await axios.get(url);
    return r.data;
  } catch (err) {
    log('[Backend2] Error fetchFromAlternative', err.message || err);
    return [];
  }
}

async function refreshCache(items = []) {
  try {
    log('[Backend2] refreshCache start');
    const result = { updated: new Date().toISOString(), items: {} };

    for (const item of items) {
      const prices = await fetchFromAlternative(item.id);
      result.items[item.id] = prices;
    }

    fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
    log('[Backend2] refreshCache saved to', OUTPUT);
  } catch (err) {
    log('[Backend2] refreshCache error', err);
  }
}

module.exports = { fetchFromAlternative, refreshCache, OUTPUT };
