// backend2/server.js

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3002;

app.use(cors());

// Endpoint para buscar un ítem por nombre
app.get("/api/item", async (req, res) => {
  const itemName = req.query.name;

  if (!itemName) {
    return res.status(400).json({ error: "Parámetro 'name' es requerido." });
  }

  try {
    const response = await axios.get(`https://api.nyxsoft.dev/albion/items/${encodeURIComponent(itemName)}`);

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ error: "Ítem no encontrado." });
    }

    const item = response.data[0];

    res.json({
      name: item.name,
      uniqueName: item.uniqueName,
      sellPriceMin: item.sell_price_min,
      sellCity: item.sell_price_min_city,
      buyPriceMax: item.buy_price_max,
      buyCity: item.buy_price_max_city,
      profit: item.sell_price_min - item.buy_price_max,
      image: `https://render.albiononline.com/v1/item/${item.uniqueName}.png`
    });
  } catch (error) {
    console.error("Error consultando NyxSoft API:", error.message);
    res.status(500).json({ error: "Error al consultar el servidor externo." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en http://localhost:${PORT}`);
});
