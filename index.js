const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Permitir CORS desde cualquier origen
app.use(cors());

// Función reutilizable para consultar precios desde la API externa
const fetchItemPrices = async (itemName, res) => {
  if (!itemName) {
    return res.status(400).json({ error: 'El parámetro del nombre del ítem es obligatorio.' });
  }

  try {
    const url = `https://api.nyxsoft.dev/searchItemPrices?query=${encodeURIComponent(itemName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).json({ error: 'Error al consultar la API externa.' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Backend2] Error al obtener precios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Ruta original: /api/item?name=ITEM_ID
app.get('/api/item', (req, res) => {
  fetchItemPrices(req.query.name, res);
});

// Ruta adicional para que el frontend funcione: /api/precios?id=ITEM_ID
app.get('/api/precios', (req, res) => {
  fetchItemPrices(req.query.id, res);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en http://localhost:${PORT}`);
});
