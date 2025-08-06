const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/items', async (req, res) => {
  try {
    const ids = [
      'T4_BAG', 'T5_BAG', 'T6_BAG', 'T7_BAG', 'T8_BAG'
    ].join(',');

    const locations = [
      'Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Thetford', 'Fort Sterling', 'Brecilien'
    ].join(',');

    const url = `https://west.albion-online-data.com/api/v2/stats/prices?ids=${ids}&locations=${locations}`;
    const response = await axios.get(url);
    const rawData = response.data;

    const { default: itemData } = await import('./items.json', {
      assert: { type: 'json' }
    });

    const result = rawData.map(entry => {
      const item = itemData.find(i => i.UniqueName === entry.item_id);
      return {
        ...entry,
        localized_name: item?.LocalizedNames?.['ES-ES'] || entry.item_id
      };
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Error al obtener precios:', error.message);
    res.status(500).json({ error: 'Error al obtener datos del mercado' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend 2 corriendo en puerto ${PORT}`);
});
