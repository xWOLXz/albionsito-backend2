const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/items', async (req, res) => {
  try {
    // 1. Obtener todos los ítems comerciables desde el repo oficial de Albion
    const responseItems = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json');
    const itemsData = await responseItems.json();

    // 2. Filtrar ítems comerciables (nada de JOURNAL, QUEST, TEST, ARTEFACT, etc.)
    const ids = itemsData
      .filter(item =>
        item.UniqueName &&
        !item.UniqueName.includes('JOURNAL') &&
        !item.UniqueName.includes('QUESTITEM') &&
        !item.UniqueName.includes('TEST_') &&
        !item.UniqueName.includes('ARTEFACT') &&
        !item.UniqueName.includes('_SKIN') &&
        !item.UniqueName.includes('TROPHY') &&
        !item.UniqueName.includes('RANDOM') &&
        !item.UniqueName.includes('UNIQUE') &&
        !item.UniqueName.includes('TOKEN')
      )
      .map(item => item.UniqueName);

    const selectedIds = ids.slice(0, 120); // puedes aumentar el límite si Render no se satura

    // 3. Hacer la solicitud de precios reales a la API pública confiable
    const priceURL = `https://west.albion-online-data.com/api/v2/stats/prices/${selectedIds.join(',')}?locations=Caerleon,Bridgewatch,Lymhurst,Martlock,Thetford,FortSterling,Brecilien`;

    const pricesRes = await fetch(priceURL);
    const prices = await pricesRes.json();

    console.log('✅ Backend2 cargó precios desde west.albion-online-data:', prices.length);
    res.json(prices);
  } catch (error) {
    console.error('❌ Error grave en backend2:', error.message);
    res.status(500).json({ error: 'Error interno en backend2' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en puerto ${PORT}`);
});
