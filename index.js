const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/items', async (req, res) => {
  try {
    const itemListRes = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json');
    const itemList = await itemListRes.json();

    const tradeableItemIds = itemList
      .filter(item => item.UniqueName && !item.UniqueName.includes("QUESTITEM") && !item.UniqueName.includes("TEST_") && !item.UniqueName.includes("JOURNAL") && !item.UniqueName.includes("ARTEFACT"))
      .map(item => item.UniqueName);

    const ids = tradeableItemIds.slice(0, 100).join(',');

    const priceRes = await fetch(`https://api.navi.albion-online-data.com/v1/stats/prices/${ids}?locations=Caerleon,Bridgewatch,Lymhurst,Martlock,Thetford,Fort Sterling,Brecilien`);
    const prices = await priceRes.json();

    console.log('✅ Datos obtenidos desde NAVI:', prices.length);
    res.json(prices);
  } catch (error) {
    console.error('❌ Error en backend2:', error.message);
    res.status(500).json({ error: 'Error interno en backend2' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en puerto ${PORT}`);
});
