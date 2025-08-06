const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Lista de ciudades válidas
const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Thetford', 'Fort Sterling', 'Brecilien'];

// Middleware
app.use(cors());

// Ruta básica
app.get('/', (req, res) => {
  res.send('✅ albionsito-backend2 funcionando correctamente.');
});

// Ruta para obtener datos desde Albion Data API
app.get('/items', async (req, res) => {
  try {
    // Cargar lista de ítems reales (desde GitHub AlbionData, por ejemplo)
    const itemsRes = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json');
    const itemsJson = await itemsRes.json();

    // Filtrar ítems comerciables
    const validItems = itemsJson.filter(item => item.UniqueName && item.LocalizedNames?.['ES'] && item.Tradable);

    // Tomar solo los primeros 50 para no saturar Render Free
    const limitedItems = validItems.slice(0, 50);

    const itemIds = limitedItems.map(item => item.UniqueName).join(',');
    const locations = CITIES.join(',');

    // Consultar API de precios
    const url = `https://west.albion-online-data.com/api/v2/stats/prices?ids=${itemIds}&locations=${locations}`;
    const pricesRes = await fetch(url);
    const pricesJson = await pricesRes.json();

    // Enlazar info visual con precios
    const enrichedData = limitedItems.map((item) => {
      const matches = pricesJson.filter(p => p.item_id === item.UniqueName);

      const sell_price_min = Math.min(...matches.map(p => p.sell_price_min).filter(p => p > 0)) || 0;
      const buy_price_max = Math.max(...matches.map(p => p.buy_price_max).filter(p => p > 0)) || 0;

      return {
        item_id: item.UniqueName,
        localized_name: item.LocalizedNames['ES'],
        image: `https://render.albiononline.com/v1/item/${item.UniqueName}.png`,
        sell_price_min,
        buy_price_max
      };
    });

    console.log(`✅ Backend2 respondió con ${enrichedData.length} ítems`);
    res.json(enrichedData);
  } catch (err) {
    console.error('❌ Error en backend2:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend2 corriendo en el puerto ${PORT}`);
});
