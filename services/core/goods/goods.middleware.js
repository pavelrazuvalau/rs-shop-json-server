const express = require('express');
const router = express.Router();
const url = require('url');

function getAllGoods(server) {
  const goods = server.db.getState().goods;
  const categories = Object.keys(goods);
  const subCategories = categories
    .map((category) => Object.keys(goods[category]))
    .flat();
  return categories
    .map((category) =>
      subCategories.map((subCategory) => {
        const currentCategory = goods[category][subCategory];
        return currentCategory && currentCategory.map(item => ({ item, category, subCategory }));
      })
    ).flat(3).filter(Boolean);
}

module.exports = (server) => {
  router.get('/goods/search', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query;

    const allGoods = getAllGoods(server);

    res.json(
      allGoods
        .filter(
          (goods) =>
            goods.item.name.toLowerCase().indexOf(query.text.toLowerCase()) >= 0
        )
        .slice(0, 10)
    );
  });

  router.get('/goods/category/:category', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query,
      from = query.start || 0,
      to = +query.start + +query.count,
      category = req.params.category,
      goods =
        Object.keys(server.db.getState().goods[category]).reduce(
          (acc, subCategory) => {
            return [
              ...acc,
              ...server.db.getState().goods[category][subCategory],
            ];
          },
          []
        ) || [];

    if (goods.length < to || !to) {
      to = goods.length;
    }
    goods = goods.slice(from, to);

    res.json(goods);
  });

  router.get('/goods/category/:category/:subCategory', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query,
      from = query.start || 0,
      to = +query.start + +query.count,
      category = req.params.category,
      subCategory = req.params.subCategory,
      goods = server.db.getState().goods[category][subCategory] || [];

    if (goods.length < to || !to) {
      to = goods.length;
    }
    goods = goods.slice(from, to);

    res.json(goods);
  });

  router.get('/goods/item/:id', (req, res) => {
    const allGoods = getAllGoods(server);
    const goodsItem = allGoods.find(goods => goods.item.id === req.params.id);


    if (!goodsItem) {
      res.status(404);
    }

    res.json(goodsItem);
  });

  return router;
};
