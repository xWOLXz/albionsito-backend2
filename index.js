const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// ✅ Permitir solo tu frontend de Vercel
const corsOptions = {
  origin: 'https://albionsito.vercel.app',
  methods: ['GET'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 🚀 Ruta de búsqueda por nombre
app.get('/api/item', async (req, res) => {
  const itemName = req.query.name;

  console.log('[LOG] Petición recibida a /api/item con nombre:', itemName);

  if (!itemName) {
    console.warn('[WARN] No se proporcionó "name"');
    return res.status(400).json({ error: 'El parámetro "name" es obligatorio.' });
  }

  try {
    const url = `https://api.nyxsoft.dev/searchItemPrices?query=${encodeURIComponent(itemName)}`;
    console.log('[LOG] Consultando:', url);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[ERROR] La API externa respondió mal:', response.status);
      return res.status(500).json({ error: 'Error al consultar la API externa.' });
    }

    const data = await response.json();
    console.log('[LOG] Respuesta exitosa con', data.length, 'resultados');
    res.json(data);
  } catch (error) {
    console.error('[FATAL ERROR] Falló la búsqueda:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ✅ Ruta de prueba para saber si el backend vive
app.get('/', (req, res) => {
  res.send('🟢 Backend2 funcionando correctamente.');
});

app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en http://localhost:${PORT}`);
});
