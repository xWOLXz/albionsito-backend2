const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const logs = require('log-color');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

const BASE_URL = 'https://api.albiononline2d.com/api/v2/stats/prices';

app.get('/api/market', async (req, res) => {
  try {
    logs.info('[BACKEND 2] ⏳ Obteniendo ítems automáticamente desde albiononline2d.com...');

    const itemListUrl = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json';
    const response = await fetch(itemListUrl);
    const itemsData = await response.json();
    const tradableItems = itemsData
      .filter(i => i.UniqueName && i.Tradable && !i.UniqueName.includes("QUESTITEM"))
      .map(i => i.UniqueName);

    const selectedItems = tradableItems.slice(0, 50); // puedes ajustar
    const cities = ['Caerleon', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Martlock', 'Thetford', 'Brecilien'];

    const allRequests = [];

    for (let i = 0; i < selectedItems.length; i += 10) {
      const group = selectedItems.slice(i, i + 10).join(',');
      const url = `${BASE_URL}/${group}?locations=${cities.join(',')}`;
      allRequests.push(fetch(url).then(res => res.json()));
    }

    const allResults = await Promise.all(allRequests);
    const flatResults = allResults.flat().filter(entry => entry.sell_price_min > 0 || entry.buy_price_max > 0);

    logs.success(`[BACKEND 2] ✅ Datos recibidos correctamente (${flatResults.length} registros)`);
    res.json(flatResults);
  } catch (error) {
    logs.error(`[BACKEND 2] ❌ Error obteniendo datos: ${error}`);
    res.status(500).json({ error: 'Error al obtener datos del mercado.' });
  }
});

app.listen(PORT, () => {
  logs.done(`🟢 albionsito-backend2 escuchando en http://localhost:${PORT}`);
});
