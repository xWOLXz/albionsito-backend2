// mergePrices.js
// Combina datos de backend1 y backend2 para unificar precios y marcar coincidencias

function mergePrices(data1, data2) {
    const merged = [];

    const mapBackend1 = new Map();
    data1.forEach(item => {
        mapBackend1.set(item.item_id + "_" + item.city, item);
    });

    data2.forEach(item2 => {
        const key = item2.item_id + "_" + item2.city;
        const item1 = mapBackend1.get(key);

        if (item1) {
            merged.push({
                item_id: item2.item_id,
                city: item2.city,
                sell_price_min: item2.sell_price_min,
                sell_price_min_date: item2.sell_price_min_date,
                buy_price_max: item2.buy_price_max,
                buy_price_max_date: item2.buy_price_max_date,
                backend1_sell: item1.sell_price_min,
                backend1_buy: item1.buy_price_max,
                verificado: item1.sell_price_min === item2.sell_price_min &&
                            item1.buy_price_max === item2.buy_price_max
            });
        } else {
            merged.push({
                ...item2,
                backend1_sell: null,
                backend1_buy: null,
                verificado: false
            });
        }
    });

    return merged;
}

module.exports = mergePrices;
