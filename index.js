// index.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

function esReciente(fechaISO, minutos = 15) {
  if (!fechaISO) return false;
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diferencia = (ahora - fecha) / 60000;
  return diferencia <= minutos;
}

app.get('/items', async (req, res) => {
  try {
    // 1. Obtener ítems comerciables del repositorio oficial
    const responseItems = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json');
    const itemsData = await responseItems.json();

    // 2. Filtrar ítems comerciables reales
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

    const selectedIds = ids.slice(0, 120); // puedes aumentar si Render lo permite

    // 3. Obtener precios desde la API más reciente posible
    const priceURL = `https://west.albion-online-data.com/api/v2/stats/prices/${selectedIds.join(',')}?locations=Caerleon,Bridgewatch,Lymhurst,Martlock,Thetford,FortSterling,Brecilien`;
    const pricesRes = await fetch(priceURL);
    const rawPrices = await pricesRes.json();

    const resultado = {};

    rawPrices.forEach(entry => {
      const {
        item_id,
        location,
        sell_price_min,
        sell_price_min_date,
        buy_price_max,
        buy_price_max_date
      } = entry;

      if (!resultado[item_id]) {
        resultado[item_id] = {};
      }

      if (!resultado[item_id][location]) {
        resultado[item_id][location] = {
          venta: [],
          compra: []
        };
      }

      // Precios de venta recientes
      if (sell_price_min > 0 && esReciente(sell_price_min_date)) {
        resultado[item_id][location].venta.push({
          precio: sell_price_min,
          fecha: sell_price_min_date
        });
      }

      // Precios de compra recientes
      if (buy_price_max > 0 && esReciente(buy_price_max_date)) {
        resultado[item_id][location].compra.push({
          precio: buy_price_max,
          fecha: buy_price_max_date
        });
      }
    });

    console.log('✅ Backend2 cargó y filtró correctamente los precios recientes');
    res.json({
      actualizado: new Date().toISOString(),
      items: resultado
    });
  } catch (error) {
    console.error('❌ Error grave en backend2:', error.message);
    res.status(500).json({ error: 'Error interno en backend2' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en puerto ${PORT}`);
});
