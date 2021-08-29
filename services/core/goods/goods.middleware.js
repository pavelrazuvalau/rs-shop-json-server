const express = require('express');
const router = express.Router();
const url = require('url');

module.exports = (server) => {
  router.get('/goods/search', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query,
      goods = server.db.getState().goods;

    const categories = Object.keys(goods);
    const subCategories = categories
      .map((category) => Object.keys(goods[category]))
      .flat();
    const allGoods = categories
      .map((category) =>
        subCategories.map((subCategory) => goods[category][subCategory] || [])
      )
      .flat(2);

    console.log(subCategories);

    res.json(
      allGoods.filter(
        (item) => item.name.toLowerCase().indexOf(query.text.toLowerCase()) >= 0
      ).slice(0, 10)
    );
  });

  router.get('/goods/:category', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query,
      from = query.start || 0,
      to = +query.start + +query.count,
      category = req.params.category,
      goods = Object.keys(server.db.getState().goods[category]).reduce(
        (acc, subCategory) => {
          return [...acc, ...server.db.getState().goods[category][subCategory]];
        },
        []
      ) || [];

    if (goods.length < to || !to) {
      to = goods.length;
    }
    goods = goods.slice(from, to);

    res.json(goods);
  });

  router.get('/goods/:category/:subCategory', (req, res) => {
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

  router.get('/goods/:category/:subCategory/:id', (req, res) => {
    let category = req.params.category,
      subCategory = req.params.subCategory,
      goods = server.db.getState().goods[category][subCategory];

    res.json(goods.find((item) => item.id === req.params.id));
  });

  return router;
};
