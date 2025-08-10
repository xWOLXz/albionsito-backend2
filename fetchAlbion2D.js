import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { info, error } from './utils/logger.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'prices2d.json');

const API_URL = (id, q) => `https://www.checkprices.net/api/v1/items/${encodeURIComponent(id)}/prices`;

function normalizeApi(apiData) {
  const result = {};

  if (!apiData || !apiData.items) return result;

  for (const entry of apiData.items) {
    const city = entry.city;
    if (!city) continue;

    if (!result[city]) result[city] = { sell: [], buy: [], updated: null };

    if (entry.sell_price_min && entry.sell_price_min > 0) {
      result[city].sell.push({ price: entry.sell_price_min, date: entry.sell_price_min_date || null });
    }
    if (entry.buy_price_max && entry.buy_price_max > 0) {
      result[city].buy.push({ price: entry.buy_price_max, date: entry.buy_price_max_date || null });
    }

    const dates = [entry.sell_price_min_date, entry.buy_price_max_date].filter(Boolean);
    for (const d of dates) {
      if (!result[city].updated || new Date(d) > new Date(result[city].updated)) {
        result[city].updated = d;
      }
    }
  }

  for (const city of Object.keys(result)) {
    result[city].sell = result[city].sell.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    result[city].buy = result[city].buy.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  }

  return result;
}

export async function fetchPrices(itemId, quality = 1) {
  try {
    info(`Fetching API2 ${itemId} q=${quality}`);
    const url = API_URL(itemId, quality);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`API status ${r.status}`);
    const json = await r.json();
    const norm = normalizeApi(json);
    const adapted = {};
    for (const [city, val] of Object.entries(norm)) {
      adapted[city] = {
        orden_venta: val.sell.map(s => ({ precio: s.price, fecha: s.date })),
        orden_compra: val.buy.map(b => ({ precio: b.price, fecha: b.date })),
        actualizado: val.updated
      };
    }
    return { updated: new Date().toISOString(), precios: adapted };
  } catch (err) {
    error(err.message);
    // fallback a cache local
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { updated: null, precios: {} };
    }
  }
}
