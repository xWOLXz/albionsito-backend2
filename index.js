const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get("/api/prices", async (req, res) => {
  const { items, locations, qualities = 1 } = req.query;

  if (!items || !locations) {
    return res.status(400).json({ error: "Faltan parámetros: items o locations" });
  }

  const encodedItems = encodeURIComponent(items);
  const encodedLocations = encodeURIComponent(locations);
  const url = `https://west.albion-online-data.com/api/v2/stats/prices/${encodedItems}?locations=${encodedLocations}&qualities=${qualities}`;

  console.log("🟡 Consultando API Albion 2D (west):", url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("🟢 Datos recibidos de Albion 2D:", data.length, "ítems.");
    res.json(data);
  } catch (error) {
    console.error("🔴 Error al obtener datos de Albion 2D API:", error);
    res.status(500).json({ error: "Error al obtener datos de Albion 2D API" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend Albion funcionando con datos del servidor AMÉRICA (west).");
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend2 (Albion América) corriendo en http://localhost:${PORT}`);
});
