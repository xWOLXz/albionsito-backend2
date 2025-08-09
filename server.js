// server.js (ES module) - agregador de Backend1 + Backend2
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import logger from './utils/logger.js';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

// URLs públicas de tus backends (ajusta si cambian)
const BACKEND1_URL = 'https://albionsito-backend.onrender.com/api/prices';
const BACKEND2_URL = 'https://albionsito-backend2.onrender.com/api/prices'; // si colocas agregador en el mismo dominio, puede apuntar localmente

// Helper: normaliza respuesta de backend1 (forma: { item, prices: { city: { sell: [{price,date}], buy: [...] } } })
function normalizeBackend1(respJson) {
  const out = {};
  if (!respJson) return out;

  const prices = respJson.prices || respJson.data || respJson;
  // prices puede venir anidado como { city: { sell:[], buy:[], updated } }
  if (typeof prices !== 'object') return out;

  for (const [city, obj] of Object.entries(prices)) {
    out[city] = out[city] || { sell: [], buy: [], updated: null };
    if (obj.sell && Array.isArray(obj.sell)) {
      for (const s of obj.sell) {
        out[city].sell.push({
          price: s.price ?? s.precio ?? s,
          date: s.date ?? s.fecha ?? obj.updated ?? null,
          source: 'A' // backend1 -> 🅰
        });
      }
    }
    if (obj.buy && Array.isArray(obj.buy)) {
      for (const b of obj.buy) {
        out[city].buy.push({
          price: b.price ?? b.precio ?? b,
          date: b.date ?? b.fecha ?? obj.updated ?? null,
          source: 'A'
        });
      }
    }
    // updated
    out[city].updated = out[city].updated || obj.updated || obj.actualizado || null;
  }
  return out;
}

// Helper: normaliza respuesta de backend2 (forma: { updated, precios: { city: { orden_venta: [{precio,fecha}], orden_compra: [...] } } })
function normalizeBackend2(respJson) {
  const out = {};
  if (!respJson) return out;

  const precios = respJson.precios || respJson.prices || respJson.data || respJson;
  if (typeof precios !== 'object') return out;

  for (const [city, obj] of Object.entries(precios)) {
    out[city] = out[city] || { sell: [], buy: [], updated: null };
    const ov = obj.orden_venta || obj.sell || [];
    const oc = obj.orden_compra || obj.buy || [];

    if (Array.isArray(ov)) {
      for (const s of ov) {
        out[city].sell.push({
          price: s.precio ?? s.price ?? s,
          date: s.fecha ?? s.date ?? obj.actualizado ?? respJson.updated ?? null,
          source: 'B' // backend2 -> 🅱
        });
      }
    }

    if (Array.isArray(oc)) {
      for (const b of oc) {
        out[city].buy.push({
          price: b.precio ?? b.price ?? b,
          date: b.fecha ?? b.date ?? obj.actualizado ?? respJson.updated ?? null,
          source: 'B'
        });
      }
    }

    out[city].updated = out[city].updated || obj.actualizado || obj.updated || respJson.updated || null;
  }
  return out;
}

// Combina normalizados A + B -> formato final pedido
function combineNormalized(aNorm, bNorm, maxPerType = 5) {
  const cities = new Set([...Object.keys(aNorm), ...Object.keys(bNorm)]);
  const result = {};

  for (const city of cities) {
    const sellEntries = [];
    const buyEntries = [];
    const allUpdated = [];

    const pushEntries = (arr) => {
      for (const e of arr) {
        // Asegurar tipos
        const price = typeof e.price === 'number' ? e.price : Number(e.price);
        const date = e.date ? new Date(e.date).toISOString() : null;
        sellEntries; // noop
        if (!isNaN(price)) {
          // We'll push generically later into sell/buy
        }
        if (e.type === 'buy') {
          buyEntries.push({ price, date, sources: [e.source] });
        } else {
          sellEntries.push({ price, date, sources: [e.source] });
        }
      }
    };

    // collect raw from aNorm and bNorm
    const rawSell = [
      ...(aNorm[city]?.sell?.map(x => ({ price: x.price, date: x.date, source: x.source })) || []),
      ...(bNorm[city]?.sell?.map(x => ({ price: x.price, date: x.date, source: x.source })) || [])
    ];
    const rawBuy = [
      ...(aNorm[city]?.buy?.map(x => ({ price: x.price, date: x.date, source: x.source })) || []),
      ...(bNorm[city]?.buy?.map(x => ({ price: x.price, date: x.date, source: x.source })) || [])
    ];

    // Group by price|date so same exact record can get merged sources
    function groupAndSort(rawArr, sortDesc = true) {
      const map = new Map();
      for (const it of rawArr) {
        const price = (typeof it.price === 'number') ? it.price : Number(it.price);
        if (isNaN(price)) continue;
        const dateKey = it.date ? new Date(it.date).toISOString() : '';
        const key = `${price}|${dateKey}`;
        if (!map.has(key)) {
          map.set(key, { precio: price, fecha: dateKey || null, fuentes: new Set([it.source]) });
        } else {
          map.get(key).fuentes.add(it.source);
        }
      }
      const arr = Array.from(map.values()).map(x => ({
        precio: x.precio,
        fecha: x.fecha,
        fuentes: Array.from(x.fuentes).sort() // will be like ['A'] or ['A','B'] etc.
      }));
      // Sort by fecha desc (most recent) or by price depending. We want recent market movement — so sort by fecha desc, fallback by price
      arr.sort((r1, r2) => {
        const d1 = r1.fecha ? new Date(r1.fecha).getTime() : 0;
        const d2 = r2.fecha ? new Date(r2.fecha).getTime() : 0;
        if (d1 !== d2) return d2 - d1; // newer first
        return r1.precio - r2.precio;
      });
      return arr.slice(0, maxPerType);
    }

    const sells = groupAndSort(rawSell, true).map(r => ({
      precio: r.precio,
      fecha: r.fecha,
      fuentes: r.fuentes.map(s => (s === 'A' ? '🅰' : s === 'B' ? '🅱' : s))
    }));

    const buys = groupAndSort(rawBuy, true).map(r => ({
      precio: r.precio,
      fecha: r.fecha,
      fuentes: r.fuentes.map(s => (s === 'A' ? '🅰' : s === 'B' ? '🅱' : s))
    }));

    // ultimo actualizado por ciudad (max fecha)
    const candidates = [
      ...(aNorm[city]?.sell || []).map(x => x.date),
      ...(aNorm[city]?.buy || []).map(x => x.date),
      ...(bNorm[city]?.sell || []).map(x => x.date),
      ...(bNorm[city]?.buy || []).map(x => x.date)
    ].filter(Boolean).map(d => new Date(d).toISOString());

    const lastUpdated = candidates.length ? new Date(Math.max(...candidates.map(d => new Date(d).getTime()))).toISOString() : null;

    result[city] = {
      orden_venta: sells,
      orden_compra: buys,
      actualizado: lastUpdated
    };
  }

  return result;
}

// Endpoint principal
app.get('/api/combined-prices', async (req, res) => {
  const { itemId, quality = '1' } = req.query;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });

  const qNum = Number(quality) || 1;
  if (qNum < 1 || qNum > 5) return res.status(400).json({ error: 'quality must be 1..5' });

  logger.info(`Agregador: petición combinada para ${itemId} quality=${qNum}`);

  // Llamamos a Backend1 y Backend2 en paralelo
  const url1 = `${BACKEND1_URL}?itemId=${encodeURIComponent(itemId)}&quality=${qNum}`;
  const url2 = `${BACKEND2_URL}?itemId=${encodeURIComponent(itemId)}&quality=${qNum}`;

  let resp1 = null;
  let resp2 = null;

  try {
    const [r1, r2] = await Promise.allSettled([fetch(url1, { timeout: 10000 }), fetch(url2, { timeout: 10000 })]);

    if (r1.status === 'fulfilled' && r1.value.ok) {
      resp1 = await r1.value.json();
    } else {
      logger.error(`Agregador: fallo backend1 -> ${r1.status === 'rejected' ? r1.reason?.message : `HTTP ${r1.value?.status}`}`);
    }

    if (r2.status === 'fulfilled' && r2.value.ok) {
      resp2 = await r2.value.json();
    } else {
      logger.error(`Agregador: fallo backend2 -> ${r2.status === 'rejected' ? r2.reason?.message : `HTTP ${r2.value?.status}`}`);
    }
  } catch (err) {
    logger.error('Agregador: error en fetch paralelo: ' + (err.message || err));
  }

  // Normalizar
  const n1 = normalizeBackend1(resp1);
  const n2 = normalizeBackend2(resp2);

  const combined = combineNormalized(n1, n2, 5);

  // meta: incluir qué backends respondieron
  const meta = {
    fetchedFrom: {
      backend1: !!resp1,
      backend2: !!resp2
    },
    itemId,
    quality: qNum,
    generatedAt: new Date().toISOString()
  };

  res.json({ meta, precios: combined });
});

app.get('/api/ping', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  logger.info(`Agregador escuchando en http://localhost:${PORT}`);
});
