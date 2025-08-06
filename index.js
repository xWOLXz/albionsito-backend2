const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/items', async (req, res) => {
  try {
    // 1. Obtener el listado de ítems reales
    const itemsRes = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json');
    const itemsJson = await itemsRes.json();

    // 2. Filtrar ítems comerciables (sin journals, avatars, black market, etc.)
    const comerciables = itemsJson.filter(item =>
      item.UniqueName &&
      item.ShopCategory &&
      !item.UniqueName.includes('TOKEN') &&
      !item.UniqueName.includes('JOURNAL') &&
      !item.UniqueName.includes('QUESTITEM') &&
      !item.UniqueName.includes('AVATAR') &&
      !item.UniqueName.includes('TUTORIAL') &&
      !item.UniqueName.includes('EXP') &&
      !item.UniqueName.includes('SKILLBOOK')
    );

    // 3. Extraer IDs únicos
    const ids = [...new Set(comerciables.map(i => i.UniqueName))].slice(0, 200); // se puede subir a más si lo soporta render

    // 4. Consultar la API de respaldo
    const pricesRes = await fetch(`https://west.albion-online-data.com/api/v2/stats/prices?ids=${ids.join(',')}&locations=Caerleon,Bridgewatch,Lymhurst,Martlock,Thetford,Fort%20Sterling,Brecilien`);
    const prices = await pricesRes.json();

    console.log(`✅ [BACKUP] ${prices.length} precios recuperados`);
    res.json(prices);
  } catch (error) {
    console.error('❌ [BACKUP] Error:', error);
    res.status(500).json({ error: 'Error al obtener precios desde el backend de respaldo' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [BACKUP] Servidor corriendo en puerto ${PORT}`);
});
