// albionsito-backend2/mergePrices.js

/**
 * Combina datos de precios de dos backends.
 * Cada dato tiene esta estructura:
 * {
 *   city1: { sell: [{price, date}], buy: [{price, date}], updated: string|null },
 *   city2: {...},
 *   ...
 * }
 * 
 * Retorna objeto con ciudades combinadas y para cada ciudad,
 * los 5 precios más recientes para venta y compra ordenados por fecha descendente.
 */
export function mergePricesData(data1, data2) {
  const merged = {};

  const cities = new Set([...Object.keys(data1), ...Object.keys(data2)]);

  for (const city of cities) {
    const sell1 = data1[city]?.sell || [];
    const sell2 = data2[city]?.sell || [];
    const buy1 = data1[city]?.buy || [];
    const buy2 = data2[city]?.buy || [];

    const combinedSell = [...sell1, ...sell2]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const combinedBuy = [...buy1, ...buy2]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Obtener la fecha de actualización más reciente
    const updatedDates = [data1[city]?.updated, data2[city]?.updated].filter(Boolean);
    const updated = updatedDates.length
      ? updatedDates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b))
      : null;

    merged[city] = {
      sell: combinedSell,
      buy: combinedBuy,
      updated,
    };
  }

  return merged;
}
