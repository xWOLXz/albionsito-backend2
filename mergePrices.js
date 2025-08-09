// mergePrices.js
// Combina datos de backend1 y backend2 para unificar precios de forma colaborativa

function mergePrices(data1, data2) {
    const merged = [];
    const mapBackend1 = new Map();

    // Guardamos datos de backend1 indexados por item+ciudad
    data1.forEach(item => {
        const key = `${item.item_id}_${item.city}`;
        if (!mapBackend1.has(key)) {
            mapBackend1.set(key, []);
        }
        mapBackend1.get(key).push(item);
    });

    // Recorremos backend2 y unimos
    data2.forEach(item2 => {
        const key = `${item2.item_id}_${item2.city}`;
        const listBackend1 = mapBackend1.get(key) || [];

        if (listBackend1.length > 0) {
            listBackend1.forEach(item1 => {
                // Determinar precio más confiable para venta
                const sellPriceMin = Math.min(
                    item1.sell_price_min || Infinity,
                    item2.sell_price_min || Infinity
                );
                const sellSource =
                    sellPriceMin === item1.sell_price_min ? "backend1" : "backend2";

                // Determinar precio más confiable para compra
                const buyPriceMax = Math.max(
                    item1.buy_price_max || 0,
                    item2.buy_price_max || 0
                );
                const buySource =
                    buyPriceMax === item1.buy_price_max ? "backend1" : "backend2";

                merged.push({
                    item_id: item2.item_id,
                    city: item2.city,
                    sell_price_min: sellPriceMin,
                    sell_price_source: sellSource,
                    buy_price_max: buyPriceMax,
                    buy_price_source: buySource,
                    backend1: {
                        sell: item1.sell_price_min || null,
                        buy: item1.buy_price_max || null
                    },
                    backend2: {
                        sell: item2.sell_price_min || null,
                        buy: item2.buy_price_max || null
                    },
                    coincidencia:
                        item1.sell_price_min === item2.sell_price_min &&
                        item1.buy_price_max === item2.buy_price_max
                });
            });
        } else {
            // Solo backend2 tiene este item
            merged.push({
                item_id: item2.item_id,
                city: item2.city,
                sell_price_min: item2.sell_price_min || null,
                sell_price_source: "backend2",
                buy_price_max: item2.buy_price_max || null,
                buy_price_source: "backend2",
                backend1: { sell: null, buy: null },
                backend2: {
                    sell: item2.sell_price_min || null,
                    buy: item2.buy_price_max || null
                },
                coincidencia: false
            });
        }
    });

    // Ahora añadimos los que están solo en backend1
    mapBackend1.forEach((items, key) => {
        const [item_id, city] = key.split("_");
        const yaIncluido = merged.some(
            m => m.item_id === item_id && m.city === city
        );
        if (!yaIncluido) {
            items.forEach(item1 => {
                merged.push({
                    item_id,
                    city,
                    sell_price_min: item1.sell_price_min || null,
                    sell_price_source: "backend1",
                    buy_price_max: item1.buy_price_max || null,
                    buy_price_source: "backend1",
                    backend1: {
                        sell: item1.sell_price_min || null,
                        buy: item1.buy_price_max || null
                    },
                    backend2: { sell: null, buy: null },
                    coincidencia: false
                });
            });
        }
    });

    return merged;
}

module.exports = mergePrices;
