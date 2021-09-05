const express = require('express');
const router = express.Router();
const url = require('url');

function getUserByToken(server, req) {
  const authorizationHeader = (req.header('Authorization') || '').split(' ');
  const authorizationMethod = authorizationHeader[0];
  const reqToken = authorizationHeader[1];

  if (reqToken && authorizationMethod === 'Bearer') {
    return server.db.getState().users.find((user) => {
      const ret = user.token.toLowerCase() === reqToken.toLowerCase();
      if (ret) console.log(user);
      return ret;
    });
  }
}

function addListAttributes(req, server, items) {
  const currentUser = getUserByToken(server, req);

  return items.map((item) => ({
    ...item,
    isInCart:
      !!currentUser &&
      currentUser.cart.some((cartItemId) => cartItemId === item.id),
    isFavorite:
      !!currentUser &&
      currentUser.favorites.some((cartItemId) => cartItemId === item.id),
  }));
}

function getAllGoods(server, req) {
  const goods = server.db.getState().goods;
  const categories = Object.keys(goods);
  const subCategories = categories
    .map((category) => Object.keys(goods[category]))
    .flat();
  return categories
    .map((category) =>
      subCategories.map((subCategory) => {
        const currentCategory = goods[category][subCategory];
        return (
          currentCategory &&
          addListAttributes(req, server, currentCategory).map((item) => ({
            ...item,
            category,
            subCategory,
          }))
        );
      })
    )
    .flat(3)
    .filter(Boolean);
}

/**
  * @swagger
  *
  * tags:
  *   name: goods
  *   description: API for managing goods
  *
  * components:
  *   schemas:
  *     ShopItem:
  *       type: object
  *       properties:
  *         id:
  *           type: string
  *         name:
  *           type: string
  *         imageUrls:
  *           type: array
  *           items:
  *             type: string
  *         rating:
  *           type: number
  *         availableAmount:
  *           type: number
  *         price:
  *           type: number
  *         description:
  *           type: string
  *         isInCart:
  *           type: boolean
  *         isFavorite:
  *           type: boolean
*/
module.exports = (server) => {
  /**
    * @swagger
    * /goods/search?text=searchQuery:
    *   get:
    *     tags: [goods]
    *     description: Searches for the goods
    *     parameters:
    *       - in: query
    *         name: text
    *         required: true
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 $ref: '#/components/schemas/ShopItem'
  */  
  router.get('/goods/search', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query;

    const allGoods = getAllGoods(server, req);

    res.json(
      allGoods
        .filter(
          (item) =>
            item.name.toLowerCase().indexOf(query.text.toLowerCase()) >= 0
        )
        .slice(0, 10)
    );
  });
  /**
    * @swagger
    * /goods/category/{categoryId}:
    *   get:
    *     tags: [goods]
    *     description: Get goods by category
    *     parameters:
    *       - in: path
    *         name: categoryId
    *         required: true
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 $ref: '#/components/schemas/ShopItem'
    *       404:
    *         description: category not found
  */  
  router.get('/goods/category/:category', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query,
      from = query.start || 0,
      to = +query.start + +query.count,
      category = req.params.category,
      goods = addListAttributes(
        req,
        server,
        Object.keys(server.db.getState().goods[category]).reduce(
          (acc, subCategory) => {
            return [
              ...acc,
              ...server.db.getState().goods[category][subCategory],
            ];
          },
          []
        ) || []
      );

    if (goods.length < to || !to) {
      to = goods.length;
    }
    goods = goods.slice(from, to);

    res.json(goods);
  });
  /**
    * @swagger
    * /goods/category/{categoryId}/{subCategoryId}:
    *   get:
    *     tags: [goods]
    *     description: Get goods by subcategory
    *     parameters:
    *       - in: path
    *         name: categoryId
    *         required: true
    *         schema:
    *           type: string
   *       - in: path
    *         name: subCategoryId
    *         required: true
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 $ref: '#/components/schemas/ShopItem'
    *       404:
    *         description: category or subcategory not found
  */  
  router.get('/goods/category/:category/:subCategory', (req, res) => {
    let urlParts = url.parse(req.originalUrl, true),
      query = urlParts.query,
      from = query.start || 0,
      to = +query.start + +query.count,
      category = req.params.category,
      subCategory = req.params.subCategory,
      goods = addListAttributes(
        req,
        server,
        server.db.getState().goods[category][subCategory] || [],
      );

    if (goods.length < to || !to) {
      to = goods.length;
    }
    goods = goods.slice(from, to);

    res.json(goods);
  });

    /**
    * @swagger
    * /goods/item?id=itemId:
    *   get:
    *     tags: [goods]
    *     description: Gets shop item by id
    *     parameters:
    *       - in: query
    *         name: id
    *         required: true
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/ShopItem'
    *       404:
    *         description: item not found
  */  
  router.get('/goods/item/:id', (req, res) => {
    const allGoods = getAllGoods(server, req);
    const goodsItem = allGoods.find((item) => item.id === req.params.id);

    if (!goodsItem) {
      res.status(404);
    }

    res.json(goodsItem);
  });

  return router;
};
