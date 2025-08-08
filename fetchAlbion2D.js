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

// Solo endpoint válido y con quality dinámico
const SOURCE = (id, quality) =>
  `https://west.albion-online-data.com/api/v2/stats/prices/${id}.json?locations=${CITIES.join(',')}&qualities=${quality}`;

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

/**
 * Consulta la fuente y devuelve datos normalizados
 */
export async function fetchPricesMega(itemId, quality = 1) {
  logger.info(`[MegaRecopilador] Obteniendo precios para ${itemId} con calidad ${quality}`);

  try {
    const url = SOURCE(itemId, quality);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const normalized = normalizeData(json);

    return { updated: new Date().toISOString(), prices: normalized };

  } catch (err) {
    logger.error(`[MegaRecopilador] Error en fuente: ${err.message}`);
    return { updated: new Date().toISOString(), prices: {} };
  }
}

/**
 * Guarda en cache local
 */
export async function updateCache(itemId, quality = 1) {
  const data = await fetchPricesMega(itemId, quality);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  logger.info(`[MegaRecopilador] Cache actualizada para ${itemId} calidad ${quality}`);
  return data;
}
