// albionsito-backend2/fetchPrices.js
const fetch = require('node-fetch');

function esReciente(fechaISO, minutos = 60) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diferencia = (ahora - fecha) / 60000;
  return diferencia <= minutos;
}

async function fetchPrices() {
  try {
    // 1. Obtener ítems comerciables del dump oficial
    const responseItems = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json');
    const itemsData = await responseItems.json();

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

    const selectedIds = ids.slice(0, 120); // puedes ajustar

    // 2. Obtener precios desde albion-online-data.com
    const priceURL = `https://west.albion-online-data.com/api/v2/stats/prices/${selectedIds.join(',')}?locations=Caerleon,Bridgewatch,Lymhurst,Martlock,Thetford,FortSterling,Brecilien`;
    const pricesRes = await fetch(priceURL);
    const prices = await pricesRes.json();

    // 3. Procesar resultados por ítem y ciudad
    const resultado = {};

    for (const price of prices) {
      const { item_id, city, sell_price_min_date, buy_price_max_date, sell_price_min, buy_price_max } = price;

      if (!item_id || !city) continue;

      const ventaReciente = sell_price_min > 0 && sell_price_min_date && esReciente(sell_price_min_date);
      const compraReciente = buy_price_max > 0 && buy_price_max_date && esReciente(buy_price_max_date);

      if (!ventaReciente && !compraReciente) continue;

      if (!resultado[item_id]) {
        resultado[item_id] = {};
      }

      if (!resultado[item_id][city]) {
        resultado[item_id][city] = {
          ventas: [],
          compras: []
        };
      }

      if (ventaReciente) {
        resultado[item_id][city].ventas.push(sell_price_min);
      }

      if (compraReciente) {
        resultado[item_id][city].compras.push(buy_price_max);
      }
    }

    // 4. Ordenar y limitar resultados (top 10)
    for (const itemId in resultado) {
      for (const city in resultado[itemId]) {
        resultado[itemId][city].ventas = resultado[itemId][city].ventas
          .filter(p => p > 0)
          .sort((a, b) => a - b)
          .slice(0, 10);

        resultado[itemId][city].compras = resultado[itemId][city].compras
          .filter(p => p > 0)
          .sort((a, b) => b - a)
          .slice(0, 10);
      }
    }

    return resultado;
  } catch (error) {
    console.error('❌ Error al obtener precios:', error.message);
    return {};
  }
}

module.exports = fetchPrices;
