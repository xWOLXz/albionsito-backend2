import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 20000;

app.use(cors());

function logs(text) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${text}`);
}

// ✅ Endpoint principal
app.get("/api/prices", async (req, res) => {
  const { itemId, enchantments = "false" } = req.query;

  if (!itemId) {
    logs("❌ No se envió itemId en la consulta");
    return res.status(400).json({ error: "Falta itemId" });
  }

  logs(`📦 Buscando precios para: ${itemId} (encantamientos: ${enchantments})`);

  try {
    const url = `https://www.albion-online-data.com/api/v2/stats/prices/${itemId}.json`;
    const { data } = await axios.get(url);

    const cities = ["Caerleon", "Fort Sterling", "Thetford", "Lymhurst", "Bridgewatch", "Martlock"];
    const preciosPorCiudad = {};

    cities.forEach((city) => {
      const datosCiudad = data.filter((entry) => entry.city === city);

      if (datosCiudad.length > 0) {
        const ordenCompra = datosCiudad
          .map((e) => ({
            precio: e.buy_price_max,
            fecha: e.buy_price_max_date,
          }))
          .filter((e) => e.precio > 0)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 10);

        const ordenVenta = datosCiudad
          .map((e) => ({
            precio: e.sell_price_min,
            fecha: e.sell_price_min_date,
          }))
          .filter((e) => e.precio > 0)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 10);

        preciosPorCiudad[city] = {
          orden_compra: ordenCompra,
          orden_venta: ordenVenta,
        };
      }
    });

    logs(`✅ Precios obtenidos correctamente para ${itemId}`);
    res.json({
      item: itemId,
      precios: preciosPorCiudad,
    });
  } catch (error) {
    logs("❌ Error al obtener datos: " + error.message);
    res.status(500).json({ error: "Error al obtener los precios" });
  }
});

app.listen(PORT, () => {
  logs(`🟢 Servidor albionsito-backend2 escuchando en http://localhost:${PORT}`);
});
