import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import logger from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

const DATA_FILE = path.join(__dirname, "data", "prices2d.json");
const CITIES = ["Caerleon", "Bridgewatch", "Lymhurst", "Martlock", "Thetford", "Fort Sterling", "Brecilien"];

let cache = {};
if (fs.existsSync(DATA_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    cache = {};
  }
}

async function fetchAlbion2DPrices(itemId, quality) {
  const url = `https://west.albion-online-data.com/api/v2/stats/prices/${encodeURIComponent(itemId)}.json?locations=${CITIES.join(",")}&qualities=${quality}`;
  logger.log(`[Backend2] GET ${url}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error API Albion2D: ${res.statusText}`);

  const data = await res.json();
  const precios = {};

  data.forEach(entry => {
    if (!precios[entry.city]) {
      precios[entry.city] = {
        orden_venta: [],
        orden_compra: [],
        updated: entry.timestamp
      };
    }
    if (entry.sell_price_min > 0) {
      precios[entry.city].orden_venta.push({
        precio: entry.sell_price_min,
        fecha: entry.sell_price_min_date
      });
    }
    if (entry.buy_price_max > 0) {
      precios[entry.city].orden_compra.push({
        precio: entry.buy_price_max,
        fecha: entry.buy_price_max_date
      });
    }
  });

  return precios;
}

// Ruta para inicializar cache
app.get("/api/init", async (req, res) => {
  logger.log("[Backend2] Inicializando cache...");
  cache = {};
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2));
  res.json({ status: "ok" });
});

// Ruta principal de precios
app.get("/api/prices", async (req, res) => {
  const { itemId, quality = 1 } = req.query;
  if (!itemId) return res.status(400).json({ error: "itemId requerido" });

  try {
    const precios = await fetchAlbion2DPrices(itemId, quality);

    cache[itemId] = { precios, actualizado: new Date().toISOString() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2));

    res.json({ precios });
  } catch (err) {
    logger.error("[Backend2] Error obteniendo precios:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.log(`🌐 Backend2 escuchando en puerto ${PORT}`);
});
