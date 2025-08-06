// albionsito-backend2/index.js
const express = require('express');
const cors = require('cors');
const fetchPrices = require('./fetchPrices');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/items', async (req, res) => {
  try {
    const data = await fetchPrices();
    console.log('✅ Backend2 respondió con items organizados:', Object.keys(data).length);
    res.json(data);
  } catch (error) {
    console.error('❌ Error en /items:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend2 corriendo en puerto ${PORT}`);
});
