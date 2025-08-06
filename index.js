const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/items', async (req, res) => {
  try {
    console.log('🔁 Obteniendo ítems comerciables desde GitHub...');
    const itemListRes = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json');

    if (!itemListRes.ok) {
      throw new Error(`❌ Fallo al obtener items.json: ${itemListRes.status}`);
    }

    const itemList = await itemListRes.json();

    const tradeableItemIds = itemList
      .filter(item => item.UniqueName && !item.UniqueName.includes("QUESTITEM") && !item.UniqueName.includes("TEST_") && !item.UniqueName.includes("JOURNAL") && !item.UniqueName.includes("ARTEFACT"))
      .map(item => item.UniqueName);

    const ids = tradeableItemIds.slice(0, 25).join(',');

    const naviUrl = `https://api.navi.albion-online-data.com/v1/stats/prices/${ids}?locations=Caerleon,Bridgewatch,Lymhurst,Martlock,Thetford,Fort Sterling,Brecilien`;
    console.log('🌐 Solicitando precios a NAVI:', naviUrl);

    const priceRes = await fetch(naviUrl);

    if (!priceRes.ok) {
      throw new Error(`❌ Fallo al obtener precios: ${priceRes.status}`);
    }

    const prices = await priceRes.json();

    if (!Array.isArray(prices)) {
      throw new Error('❌ La respuesta de precios no es un array válido.');
    }

    console.log(`✅ NAVI devolvió ${prices.length} precios.`);
    res.json(prices);
  } catch (error) {
    console.error('❌ Error en backend2:', error.message);
    res.status(500).json({ error: 'Error interno en backend2' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend2 corriendo en puerto ${PORT}`);
});
