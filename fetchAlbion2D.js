import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import logger from './utils/logger.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'prices2d.json');

const CITIES = [
  "Caerleon",
  "Bridgewatch",
  "Lymhurst",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Brecilien"
];

// API endpoints WEST
const SOURCES = [
  id => `https://west.albion-online-data.com/api/v2/stats/prices/${id}.json?locations=${CITIES.join(',')}&qualities=1`,
  id => `https://west.albion-online-data.com/api/v2/stats/market/${id}.json?locations=${CITIES.join(',')}&qualities=1`,
  id => `https://west.albion-online-data.com/api/v2/stats/history/${id}?locations=${CITIES.join(',')}&qualities=1`
];

/**
 * Normaliza el formato para que siempre sea igual.
 */
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

  // Limitar a últimos 5
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

/**
 * Consulta todas las fuentes y combina resultados
 */
export async function fetchPricesMega(itemId) {
  logger.info(`[MegaRecopilador] Obteniendo precios para ${itemId}`);

  let finalData = {};

  for (const src of SOURCES) {
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

  return { updated: new Date().toISOString(), prices: finalData };
}

/**
 * Guarda en cache local
 */
export async function updateCache(itemId) {
  const data = await fetchPricesMega(itemId);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  logger.info(`[MegaRecopilador] Cache actualizada para ${itemId}`);
  return data;
}
