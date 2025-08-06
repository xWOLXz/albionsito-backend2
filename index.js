// albionsito-backend2/index.js
const express = require("express");
const cors = require("cors");
const { getItemPrice } = require("./services/fetchSingleItem");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());

app.get("/items", async (req, res) => {
  try {
    const itemIds = ["T8_POTION_INVISIBILITY", "T8_BAG"]; // puedes aumentar esta lista
    const results = [];

    for (const id of itemIds) {
      const data = await getItemPrice(id);
      if (data) results.push(data);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend 2 escuchando en http://localhost:${PORT}`);
});
