const { match } = require('assert');
const express = require('express');
const router = express.Router();
const url = require('url');

function makeToken(length = 24) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getUserByToken(req, res, server) {
  const authorizationHeader = req.header('Authorization').split(' ');
  const authorizationMethod = authorizationHeader[0];
  const reqToken = authorizationHeader[1];

  if (!reqToken || authorizationMethod !== 'Bearer') {
    return res.status(401).send('Unauthorized');
  }

  return server.db.getState().users.find((user) => {
    const ret = user.token.toLowerCase() === reqToken.toLowerCase();
    if (ret) console.log(user);
    return ret;
  });
}

function handleAddingToLists(server, listName, isAdding, req, res) {
  const { body } = req;
  const matchedUser = getUserByToken(req, res, server);

  if (!matchedUser) {
    return res.status(401).send('Unauthorized');
  }

  const goodId = isAdding ? body.id : url.parse(req.originalUrl, true).query.id;

  if (goodId) {
    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              [listName]: isAdding
                ? [...user[listName], goodId]
                : user[listName].filter((item) => item !== goodId),
            }
          : user
      ),
    });
    res.send(200);
  } else {
    res.status(400);
  }
}

function getAllGoods(server) {
  const goods = server.db.getState().goods;
  const categories = Object.keys(goods);
  const subCategories = categories
    .map((category) => Object.keys(goods[category]))
    .flat();
  return categories
    .map((category) =>
      subCategories.map((subCategory) => goods[category][subCategory])
    )
    .flat(3)
    .filter(Boolean);
}

function reduceAvailableCount(server, items) {
  const allGoods = getAllGoods(server);

  items.forEach((purchasedItem) => {
    const item = allGoods.find((it) => it.id === purchasedItem.id);
    item.availableAmount -= purchasedItem.amount;
  });
}
  /**
    * @swagger
    *
    * tags:
    *   name: users
    *   description: API for managing users
    *
    * components:
    *   schemas:
    *     UserLogin:
    *       type: object
    *       properties:
    *         login:
    *           type: string
    *           description: user login
    *         password:
    *           type: string
    *           description: user password
    *     UserRegister:
    *       type: object
    *       properties:
    *         firstName:
    *           type: string
    *         lastName:
    *           type: string
    *         login:
    *           type: string
    *         password:
    *           type: string
    *     TokenResponse:
    *       type: object
    *       properties:
    *         token:
    *           type: string
    *           description: user token
    *     OrderItem:
    *       type: object
    *       properties:
    *         id:
    *           type: string
    *         amount:
    *           type: number
    *     UserOrderRequest:
    *       type: object
    *       properties:
    *         items:
    *           type: array
    *           items:
    *             $ref: '#/components/schemas/OrderItem'
    *         details:
    *           type: object
    *           properties:
    *             name:
    *               type: string
    *             address:
    *               type: string
    *             phone:
    *               type: string
    *             timeToDeliver:
    *               type: string
    *             comment:
    *               type: string
    *     UserOrder:
    *       allOf:
    *         - $ref: '#/components/schemas/UserOrderRequest'
    *         - type: object
    *           properties:
    *             id:
    *               type: string 
    *     UserInfo:
    *       type: object
    *       properties:
    *         firstName:
    *           type: string
    *         lastName:
    *           type: string
    *         cart:
    *           type: array
    *           items:
    *             type: string
    *         favorites:
    *           type: array
    *           items:
    *             type: string
    *         orders:
    *           type: array
    *           items:
    *             $ref: '#/components/schemas/UserOrder'
  */
module.exports = (server) => {
  /**
    * @swagger
    * /users/login:
    *   post:
    *     tags: [users]
    *     description: Performs user login
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             $ref: '#/components/schemas/UserLogin'
    *     responses:
    *       200:
    *         description: user logged in successfully
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/TokenResponse'
    *       401:
    *         description: wrong credentials entered
  */
  router.post('/users/login', (req, res) => {
    const { body } = req;

    let users = server.db.getState().users,
      matchedUser = users.find((user) => {
        const ret = user.login.toLowerCase() === body.login.toLowerCase();
        if (ret) console.log(user);
        return ret;
      });

    if (!matchedUser) {
      res.status(401).send('Wrong username or password');
    } else if (matchedUser.password === body.password) {
      res.json({ token: matchedUser.token });
    } else {
      res.status(401).send('Wrong username or password');
    }
  });

  /**
    * @swagger
    * /users/userInfo:
    *   get:
    *     tags: [users]
    *     description: Gets current user info
    *     responses:
    *       200:
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/UserInfo'
    *       401:
    *         description: user token is missing
  */
  router.get('/users/userInfo', (req, res) => {
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    const { token, login, password, ...user } = matchedUser;

    res.json(user);
  });

  /**
    * @swagger
    * /users/register:
    *   post:
    *     tags: [users]
    *     description: Register new user
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             $ref: '#/components/schemas/UserRegister'
    *     responses:
    *       200:
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/TokenResponse'
  */
  router.post('/users/register', (req, res) => {
    const token = makeToken();

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.concat({
        ...req.body,
        token,
        cart: [],
        favorites: [],
        orders: [],
      }),
    });

    res.json({ token });
  });

  /**
    * @swagger
    * /users/favorites:
    *   post:
    *     tags: [users]
    *     description: Adds item to the favorites list
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               id:
    *                 type: string
    *     responses:
    *       200:
    *         description: item added to favorites
    *       401:
    *         description: user token is missing
  */
  router.post('/users/favorites', (req, res) => {
    handleAddingToLists(server, 'favorites', true, req, res);
  });

  /**
    * @swagger
    * /users/favorites?id=itemId:
    *   delete:
    *     tags: [users]
    *     description: Removes item from the favorites list
    *     parameters:
    *       - in: query
    *         name: id
    *         required: true
    *         schema:
    *           type: number
    *     responses:
    *       200:
    *         description: item removed from favorites
    *       401:
    *         description: user token is missing
  */
  router.delete('/users/favorites', (req, res) => {
    handleAddingToLists(server, 'favorites', false, req, res);
  });

  /**
    * @swagger
    * /users/cart:
    *   post:
    *     tags: [users]
    *     description: Adds item to the user cart
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               id:
    *                 type: string
    *     responses:
    *       200:
    *         description: item added to the user cart
    *       401:
    *         description: user token is missing
  */  
  router.post('/users/cart', (req, res) => {
    handleAddingToLists(server, 'cart', true, req, res);
  });

  /**
    * @swagger
    * /users/cart?id=itemId:
    *   delete:
    *     tags: [users]
    *     description: Removes item from the user cart
    *     parameters:
    *       - in: query
    *         name: id
    *         required: true
    *         schema:
    *           type: number
    *     responses:
    *       200:
    *         description: item removed from the user cart
    *       401:
    *         description: user token is missing
  */
  router.delete('/users/cart', (req, res) => {
    handleAddingToLists(server, 'cart', false, req, res);
  });

  /**
    * @swagger
    * /users/order:
    *   post:
    *     tags: [users]
    *     description: Submits user order
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             $ref: '#/components/schemas/UserOrderRequest'
    *     responses:
    *       200:
    *         description: order submitted
    *       401:
    *         description: user token is missing
  */  
  router.post('/users/order', (req, res) => {
    const { body } = req;
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              orders: user.orders.concat({
                id: makeToken(10),
                items: body.items,
                details: {
                  name: body.details.name,
                  address: body.details.address,
                  phone: body.details.phone,
                  timeToDeliver: body.details.timeToDeliver,
                  comment: body.details.comment,
                },
              }),
              cart: [],
            }
          : user
      ),
    });

    reduceAvailableCount(server, body.items);
    res.send(200);
  });

  /**
    * @swagger
    * /users/order:
    *   put:
    *     tags: [users]
    *     description: Edits user order
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             $ref: '#/components/schemas/UserOrder'
    *     responses:
    *       200:
    *         description: order edited
    *       401:
    *         description: user token is missing
  */  
  router.put('/users/order', (req, res) => {
    const { body } = req;
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              orders: user.orders.map((order) =>
                order.id === body.id
                  ? { ...order, details: body.details }
                  : order
              ),
            }
          : user
      ),
    });

    res.send(200);
  });

  /**
    * @swagger
    * /users/order?id=orderId:
    *   delete:
    *     tags: [users]
    *     description: Removes user order
    *     parameters:
    *       - in: query
    *         name: id
    *         required: true
    *         schema:
    *           type: number
    *     responses:
    *       200:
    *         description: order removed
    *       401:
    *         description: user token is missing
  */
  router.delete('/users/order', (req, res) => {
    const { query } = url.parse(req.originalUrl, true);
    const matchedUser = getUserByToken(req, res, server);

    if (!matchedUser) {
      return res.status(401).send('Unauthorized');
    }

    server.db.setState({
      ...server.db.getState(),
      users: server.db.getState().users.map((user) =>
        user.token === matchedUser.token
          ? {
              ...user,
              orders: user.orders.filter((order) => order.id !== query.id),
            }
          : user
      ),
    });

    res.send(204);
  });

  return router;
};
