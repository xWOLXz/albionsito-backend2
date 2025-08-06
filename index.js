const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());

app.get('/api/item', async (req, res) => {
  const itemName = req.query.name;

  if (!itemName) {
    return res.status(400).json({ error: 'El parámetro "name" es obligatorio.' });
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
});

app.listen(PORT, () => {
  console.log(`Backend2 corriendo en http://localhost:${PORT}`);
});
