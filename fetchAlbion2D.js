import fetch from 'node-fetch';
import logger from './utils/logger.js';

const CITIES = [
  "Caerleon",
  "Bridgewatch",
  "Lymhurst",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Brecilien"
];

// Función que genera las URLs de la API externa con calidad dinámica
const SOURCES = (quality) => [
  id => `https://west.albion-online-data.com/api/v2/stats/prices/${id}.json?locations=${CITIES.join(',')}&qualities=${quality}`
];

// Normaliza el formato de la API externa
function normalizeData(apiData) {
  const result = {};

  for (const entry of apiData) {
    const city = entry.city || entry.location;
    if (!CITIES.includes(city)) continue;

    if (!result[city]) {
      result[city] = { sell: [], buy: [], updated: null };
    }

    // Ventas
    if (entry.sell_price_min || entry.sell_price) {
      result[city].sell.push({
        price: entry.sell_price_min || entry.sell_price,
        date: entry.sell_price_min_date || entry.date || null
      });
    }

    // Compras
    if (entry.buy_price_max || entry.buy_price) {
      result[city].buy.push({
        price: entry.buy_price_max || entry.buy_price,
        date: entry.buy_price_max_date || entry.date || null
      });
    }

    // Fecha más reciente
    const dateCandidates = [
      entry.sell_price_min_date,
      entry.buy_price_max_date,
      entry.date
    ].filter(Boolean);

    for (const d of dateCandidates) {
      if (!result[city].updated || new Date(d) > new Date(result[city].updated)) {
        result[city].updated = d;
      }
    }
  }

  // Limitar a últimos 5 registros
  for (const city of Object.keys(result)) {
    result[city].sell = result[city].sell
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    result[city].buy = result[city].buy
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }

  return result;
}

// Adapta el formato para frontend (orden_venta, orden_compra, actualizado)
function adaptDataForFrontend(data) {
  const adapted = {};
  for (const city in data) {
    adapted[city] = {
      orden_venta: data[city].sell.map(o => ({
        precio: o.price,
        fecha: o.date
      })),
      orden_compra: data[city].buy.map(o => ({
        precio: o.price,
        fecha: o.date
      })),
      actualizado: data[city].updated
    };
  }
  return adapted;
}

// Función principal que obtiene datos de la API externa y normaliza
export async function fetchPricesMega(itemId, quality = 1) {
  logger.info(`[MegaRecopilador] Obteniendo precios para ${itemId} con calidad ${quality}`);

  let finalData = {};

  const sources = SOURCES(quality);

  for (const src of sources) {
    try {
      const url = src(itemId);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const normalized = normalizeData(json);

      // Merge con datos existentes
      for (const [city, data] of Object.entries(normalized)) {
        if (!finalData[city]) {
          finalData[city] = data;
        } else {
          finalData[city].sell = [...finalData[city].sell, ...data.sell]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

          finalData[city].buy = [...finalData[city].buy, ...data.buy]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

          if (!finalData[city].updated || new Date(data.updated) > new Date(finalData[city].updated)) {
            finalData[city].updated = data.updated;
          }
        }
      }

    } catch (err) {
      logger.error(`[MegaRecopilador] Error en fuente: ${err.message}`);
    }
  }

  const adaptedData = adaptDataForFrontend(finalData);

  return { updated: new Date().toISOString(), precios: adaptedData };
}
