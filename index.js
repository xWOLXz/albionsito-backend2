const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());

app.get("/api/prices", async (req, res) => {
  try {
    const items = req.query.items;
    const locations = req.query.locations;
    const qualities = req.query.qualities || "1";

    if (!items || !locations) {
      return res.status(400).json({ error: "Parámetros 'items' y 'locations' son requeridos." });
    }

    const encodedItems = encodeURIComponent(items);
    const encodedLocations = encodeURIComponent(locations);

    const url = `https://east.albion-online-data.com/api/v2/stats/prices/${encodedItems}?locations=${encodedLocations}&qualities=${qualities}`;

    console.log("📡 Solicitando precios desde backend2 (servidor EAST)...");
    console.log("🧩 Ítems: ", items);
    console.log("🌍 Ciudades: ", locations);
    console.log("🔗 URL generada: ", url);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`✅ Respuesta recibida con ${data.length} registros`);
    res.json(data);
  } catch (error) {
    console.error("❌ Error en backend2:", error);
    res.status(500).json({ error: "Error al obtener precios desde el backend2." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend2 (EAST) corriendo en http://localhost:${PORT}`);
});
