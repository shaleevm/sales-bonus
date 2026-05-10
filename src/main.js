/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const calculateDiscount = 1 - discount / 100;
  return sale_price * quantity * calculateDiscount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  let bonusRate = 0;
  if (index === 0) {
    bonusRate = 0.15;
  } else if (index === total - 1) {
    bonusRate = 0;
  } else if (index === 1 || index === 2) {
    bonusRate = 0.1;
  } else {
    bonusRate = 0.05;
  }
  return +(profit * bonusRate).toFixed(2);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options; // Сюда передадим функции для расчётов
  if (
    !calculateRevenue ||
    !calculateBonus ||
    typeof options !== "object" ||
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Некорректные опции");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    // Заполним начальными данными
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item]),
  );

  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item]),
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить количество продаж
    // Увеличить общую сумму выручки всех продаж
    seller.sales_count++;
    seller.revenue = +(seller.revenue + record.total_amount).toFixed(2);

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      // Посчитать прибыль: выручка минус себестоимость
      // Увеличить общую накопленную прибыль (profit) у продавца
      const cost = product.purchase_price * item.quantity;
      const revenueItem = calculateRevenue(item, product);
      const profit = revenueItem - cost;
      seller.profit += profit;

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller); // Считаем бонус
    seller.top_products = Object.entries(seller.products_sold)
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sku, quantity]) => ({ sku, quantity })); // Формируем топ-10 товаров проверить реализацию
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: seller.revenue, // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: seller.bonus, // Число с двумя знаками после точки, бонус продавца
  }));
}
